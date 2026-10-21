# Ships: how they should work (2026-10-21)

**A proposal waiting for Robin.** Robin asked (2026-10-21): "Figure out how the ships should work", with six thoughts: he still
likes building or customising his own ship (or, if that is too hard, good-looking premade ships with some parts to customise);
the rowers must face the right way; the hirdmen must sit so it looks good; they must get on and off without getting stuck;
the hero rows only when alone, else stands at the bow looking out; and, if it can be done, some fighting from or on ships.
This answers each, says what is built today, and lays out the build in steps with a test each. **Steps 1 to 4 are built (2026-10-21: the hulls at true size, the crew seated and rowing, the hero's place, on and off by the gangway; `tests/ships.js`); the questions below wait.** `docs/boats.md` (2026-10-13)
is the earlier write-up of the yard; its recommendation C is what was built and is kept here.

## What is wrong today (seen 2026-10-21 in the game, a karve with ten hirdmen)

- **The hulls are too small.** The karve is 259 units long and 31 wide: 11.9 m by 1.4 m. A real karve is 15 to 20 m by 4 to
  5 m. Two rowers do not fit abreast, so they draw over each other, and the hull is thinner than a seated man.
- **Only two of ten men boarded**: a hirdman boards only if he is within 150 units at the moment of E. The others stood 900
  units off and stayed. Nothing walks them to the ship.
- **The hero stands at the stern of a karve whatever the crew**, by the steering oar, on top of the hull rather than in it.
- **The oars scull**: they swing about a right angle with no pull and no recovery, so they do not read as rowing, and no
  rower holds one.
- Men of the engine dragged aboard (`menAboard`) are not drawn at all.

## The design

### 1. Your own ship: a designed hull, fitted out by you (Robin's thought 1)

Keep what was decided on 2026-10-13 and built: **the hull is a design chosen at the shipwright's bench** (faering, boat, karve,
longship by the bench's tier), **the fitting out is the player's** in the yard: the thwarts (how many rowers), the mast and
the sail, the steering oar, the dragon stem, the shields along the rail. The raft stays the one vessel laid piece by piece
(it teaches the yard). This is Robin's fallback ("premade good-looking ships with some parts you can customize") and it is
the right one: a hull laid strake by strake never looks like a ship, and the look of a longship is in its sheer and its
stems, which a design gives for free. What makes the ship yours grows over the chapters (mine, for later): **the sail's
stripes in your colours** and **the shields' faces** (two colours chosen at the bench), **a figurehead carved at the carver's
bench** (the dragon, a snake, a bear), **a name** given at the launch (the Lore Director's pools, `LORE?`), **a tent amidships**
for the night at sea, **a sea chest** (built). Nothing of this changes the hull.

### 2. True size

The canon scale (a unit is 4.6 cm, the hero 39 units): the hulls at the sizes they were dug up at, as the houses are.

| Hull | Length | Beam | Thwarts | Rowers | Who | Units long by wide |
| --- | --- | --- | --- | --- | --- | --- |
| Faering (Gokstad's small boat) | 6.5 m | 1.4 m | 2 | 2 (one a thwart, a pair of oars each) | the fjord | 141 by 30 |
| Boat (a sexæring) | 9 m | 2.0 m | 3 | 6 | the crossing to the big island | 196 by 43 |
| Karve | 16 m | 4.2 m | 6 | 12, and a helmsman | the first ship: a farm, a church, a small village | 348 by 91 |
| Longship | 23 m | 5.2 m | 13 | 26, and a helmsman | a town | 500 by 113 |

The thwarts a metre and a bit apart (24 units: a seated man is about 16 deep); on a karve three forward of the mast and three
aft. The yard's cell becomes that pitch (`CW` 24, a cell a thwart), so the karve is 14 cells and the longship 21; the yard's
camera zooms per hull as it does now. The screen is 615 by 385 units: a karve fills just over half its width, the longship
most of it. **The camera pulls back at sea** (mine, to try): aboard a karve to zoom 0.55, a longship 0.45, easing over a
second, back to 0.65 ashore; so the ship and the water round it show. Boats keep 0.65.

### 3. The crew seated, facing aft, rowing (thoughts 2 and 3)

- **Seats** are fixed places on the hull: a rower sits on a thwart at the gunwale, two a thwart on the boat and up (one on the
  faering), **facing aft** (rowers face the stern; they pull the boat along behind their backs). His oar goes out over the rail
  beside him. The helmsman sits at the stern on the steering-oar side (the right-hand side looking forward), **facing
  forward**, a hand on the tiller. The hurt lie amidships on the floor. A man dragged aboard sits where there is room.
- **Who sits where is a rule, not a race**: the first man aboard takes the aft-most seat on the right, the next the left, and
  so on forward, so the ship fills from the stern evenly and nobody changes seat under way. The helmsman is the man with the
  most wits aboard (the styrimaðr); with no crew but the hero, nobody.
- **One stroke for the whole ship** (`v.stroke`, a phase that runs with the speed): every rower pulls in time. **The pull** (the
  blade in the water, moving aft, two fifths of the cycle; the boat goes forward), **the recovery** (the blade lifted and carried
  forward, three fifths). When the ship lies still the oars are shipped inboard along the rail; held out level while the sail
  does the work. The oar is drawn from the rower's hands (which lean with the stroke) out over the rail to the blade.
- **The rowing clip.** The people's atlas has `sit`; it has no rowing. **Asked of the Art Director: `row`** for the people and
  for the hero's kit, seated, eight frames of pull and recovery, facing aft, in the eight directions (the oar is drawn by the
  game, so none in the clip), and **`helm`**, seated with a hand on the tiller. Until they come the `sit` clip leans with the
  stroke (a few units along the keel), which with the oars reads as rowing.
- **Drawn in the ship, not on it.** The vessel becomes one drawing: the hull's floor and far rail, then everyone aboard sorted by
  depth, then **the near rail with its shields over their legs** (today only over the hero's), then the mast, the sail and the
  stems, which stand up. Nobody aboard goes through the world's sort any more, so a rower is never drawn under the water or
  over the far gunwale. The hero at the bow is drawn by the ship too.

### 4. On and off without getting stuck (thought 4)

- **The gangway** is the point of the hull nearest the land (`v.gang`): the bow when the ship is beached, else the rail on the
  land side. E within 50 units of the hull takes the hero aboard.
- **The men are called, not teleported.** When the hero boards, every hirdman following him walks to the gangway (the walk they
  use inside the territory); within 24 units of it he climbs aboard and takes the next seat. **The ship waits for them**: W does
  nothing while a called man is still coming (a toast once, "The men are coming aboard"), **at most eight seconds**; a man
  still not aboard then but within 400 units has waded the last bit and is aboard; one further off is left (the toast
  "Astrid is left ashore"; he walks back to the stone). Nobody is ever stuck behind a rock for good: the cap and the wade are
  the safety. The hero can leave at once with Shift and E (the men keep coming to the stone).
- **Landing files them off.** E at a shore: the hero steps off at the gangway spot; the men follow one every third of a second
  onto spots on the land along the shore (`landNear`, spread so none stands on another, none in the water, none in a solid),
  each walking two steps inland so the next has room. On a raid's ground each becomes a man of the engine as his feet touch
  the sand (as built, `hirdToMan`), in a line along the shore, not a heap. At home they are hirdmen again at once.
- **A beached hull** (its bow in the wade band, at rest) is also left by walking: W at the bow steps the hero onto the sand.

### 5. The hero rows alone; with a crew he stands at the bow (thought 5)

- **Alone** on a rowing hull he sits on the aft thwart (the faering's and the boat's middle) and pulls a pair of oars (the
  kit's `row` clip; `sit` leaning until it comes). Alone on a karve he stands at the steering oar as now (a karve alone is
  slow: the handling's `rowK` with no rowers).
- **With any man aboard** he stands in the bow facing the heading, his feet on the fore deck by the stem, and turns only to
  shoot; a hirdman takes the steering oar. The speed is the rowers' and the sail's as built.
- What he sees: the camera stays on him, so at the bow the sea ahead fills more of the screen than the wake behind. That is
  the point of standing there.

### 6. Fighting from and on ships (thought 6)

It can be done, in two stages, and the second belongs to chapter 3 (the first sea, the first raid), where there is someone
to fight at sea.

- **Stage A, from the deck (chapter 2):** the hero at the bow shoots as on land (J or a click; the bow needs no arrows yet);
  hirdmen armed with a bow stand up from the oar and shoot at men on a shore or another deck within 320 units (the ship
  slows as rowers stand); a bowman ashore shoots at the ship, and **the shields along the rail stop an arrow from that side**
  as a shield does (the fitting earns its keep). No beast swims yet; the kraken (chapter 4) attacks ships in this way.
- **Stage B, on the decks (chapter 3):** **enemy vessels** with a crew of the engine's men and a ship's mind (`shipMind`: a
  patrol, sight of your ship at 900 units, closing alongside, bowmen at 300; the same `Yard.sail` with a mind at the tiller);
  **grappling**: alongside within 20 units for two seconds either side throws the lines (E at the rail, "Grapple") and **both
  ships stop, lashed**; **the decks are walkable** (the engine's `api.scene.walk`: inside either hull or across the touching
  rails, nobody over the rail into the sea), the men cross where the rails touch (a gap two wide, like a gate), and the fight
  is the land's fight on a floor of planks: the blows, the parry, the chain, a **shield wall across a deck three men wide**
  (the strongest wall there is). The hero who falls with men standing wakes at sea as the raid's rule says. **The beaten ship
  is yours**: its chest, and the hull itself (sailed home under a hirdman, the fleet) or stripped and left to drift. Nobody
  drowns at random; a man knocked over the rail climbs back on the nearest hull.

### 7. The fleet (chapter 3)

More than one hull: moored at your jetty or beached below the stone; a second ship follows yours under a hirdman at its tiller
(the mind steering to a point behind your stern); the raid's party grows with your ships, as decided. A hull has a name.

### 8. The look

The hull drawn in code at true size (it turns to any heading, which a picture cannot), **redrawn to the Art Director's karve**
(`assets/props/raid/karveBeached.png`: the dark clinker hull, the pale thwarts, the shields' faces, the oars in pale wood, the
steering oar's blade), with its palette reviewed by the studio as the art plan says. The other way, offered for Robin to see:
the studio paints each hull's plan view, the game rotates and squashes it as it does the drawn hull (the light would turn
with the hull). The stems, the mast, the sail and the dragon head stand up and stay drawn in code.

## The build, in steps, with a test each

Shared logic lives in `src/yard.js` (`Yard.crewPlaces`, `heroSeat`, `gangway`, `landingSpots`, the stroke in `sail`, `strokeLean`,
`drawOars`, `drawRigOf`): pure functions over a vessel, used by the game and the Sea Editor and measured by `tests/ships.js`; the
waiting rule and the file ashore are the game's (`BOARD`, `crewBoard`, `boardingTick`, `raftWaitTick`, `landingTick`).

| Step | What | Test |
| --- | --- | --- |
| 1 | True-size hulls (`Yard.HULLS` in metres, `CW` 24), the yard's zoom per hull, the camera pulled back at sea | `tests/ships.js` prints each hull in metres, heroes and units; two seated figures a thwart clear by 4 units; the pitch at least 20; the longship within the pulled-back screen. In the pane at Robin's size: a karve with twelve rowers |
| 2 | Seats, the stroke, the oars drawn from the hands, the vessel as one drawing with the near rail over the legs, the helmsman, the hurt amidships, the dragged-aboard drawn | `tools/visual/boats.js` renders the karve with a full crew at eight headings: every rower faces aft, every oar on his own side, the near rail over every near rower's legs. The `sit` lean until the `row` clip comes |
| 3 | The hero: rowing alone, at the bow with a crew, the camera | pane: board alone (seated aft), "Four hirdmen join" (at the bow, a helmsman aft) |
| 4 | The gangway, the called crew, the wait, the file ashore, the beached hull | `tests/ships.js` boarding trial: twelve men 0 to 500 units off on a fake shore, all aboard within 8 s, the far one left; landing: twelve spots on land, none in water, none in a solid, none on another. In the game at the starter island's beach |
| 5 | Stage A: shooting from the deck, bowmen among the hird, the rail's shields against arrows | the Battle test gets a strip of sea: "From the deck": the karve 200 off a shore with three bowmen |
| 6 | Stage B (chapter 3): enemy vessels, grappling, the decks walkable, the fight, the taken ship | `tests/battle.js ships`: two karves lashed, six on six, the ladder; the Battle test's "On the decks" |
| 7 | The fleet (chapter 3) | a second ship follows and lands its men |
| 8 | The look: the hull to the studio's karve; or its plan view as a picture | side by side at Robin's size |

Steps 1 to 4 are the same under every answer below and are built first. The Sea Editor shows the same hulls with their crews.

## Questions for Robin (defaults in brackets, so the build goes on)

1. The hull: drawn in code to the studio's karve, or the studio's painted plan view turned by the game? [in code]
2. The camera at sea pulled back by hull (karve 0.55, longship 0.45)? [yes, to try]
3. A hirdman at the steering oar whenever anyone else is aboard, the hero at the bow? [yes, as asked]
4. Fighting on the decks in chapter 3, after the raid on land is played; shooting from the deck now? [yes]
5. The yard as it is (a hull chosen, the fittings laid), the raft the one laid piece by piece? [yes]
6. Your colours on the sail and the shields chosen at the bench, the ship's name at the launch: now, or with the sagas? [later]

**Asked of the Art Director** (2026-10-21): the `row` clip (people and the hero's kit, eight frames, no oar) and the `helm`
pose; a palette review of the drawn hull against its karve. **Of the Lore Director:** the crew's lines ("To the oars", "Land",
"Astrid is left ashore") and names for ships, `LORE?` until then.
