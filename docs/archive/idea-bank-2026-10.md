# The idea bank: what was decided, built or answered (moved out 2026-11-10)

Sections taken out of `docs/idea-bank.md` in the cleanup of 2026-11-10, whole and unchanged, so the idea bank holds only what is undecided.

## Copper, charcoal and the cave (Robin decided 2026-10-07; being built)

**Decided:** charcoal comes from **morning embers** (a few lumps at any fire that burned through a night), the **charcoal clamp**
(a mound of logs under turf, lit, smoking for a day, a column of smoke over the trees; tending it when the smoke thins yields
more, leaving it still yields), and **lightning-struck trees and old fire rings** found in the wild. **The furnace is plain:**
load ore and charcoal, wait, take the bar; copper tools and weapons are workbench recipes from bars. **Copper** stays rare in
loose rocks; the real source is **green veins on the cave walls**, mined out for good (an island's cave is a hoard you spend).
**The troll's hoard** in his lair is open on the nights he walks out; outside he **walks about near the mouth where you can
see him and sneak past**, so being inside is tense: morning brings him back. **The cave is rebuilt as a smooth field** (no
square walls): winding passages, pockets, stalactites, rubble, water. **All of this is built (2026-10-07); see `CLAUDE.md`.**

**Not chosen (kept for later):** the burnt hall's charred logs as charcoal; a charcoal burner living at a clamp (a person who
could join); peat from a bog; bellows pumped in rhythm (Fantasy Life's blacksmith) and stone moulds that choose the tool;
old workings in the cave (shoring, a ruined furnace at the mouth, a miner's pack); rubble walls opened with the pick; a rope
drop to a lower level; petrified older trolls as ore; nuggets in a cave stream.

## A pet (Robin, 2026-10-23)

Robin's words: "Having a pet (dog, wolf, cat etc). The pet would follow next to you, and idle around your base when at home.
The pet should have some sort of control system. For example holding a button, let's say Control, would change your keys to
pet commands. Like Ctrl + mouse click 1 is attack. You would get a yellow circle around the mouse and mousing over things you
can interact with a pet on would highlight it and say what it does. For example 'Attack' when highlighting an enemy."

Notes toward it (Claude, not decided):
- **The dog fits the age** (the Vikings kept dogs, hunting and herding; the elkhound and the spitz types; a wolf would be a
  found-as-a-pup story, a cat a trader's rarity): the first pet a dog, met or bought, named by the player as the hero is.
- **Where it lives in the code:** the hird's follow and home routines are most of it (a hirdman follows, works and idles at
  home; the pet follows anywhere, as a hirdman does with no stone raised, and idles about the hearth at home); a beast's body
  from the engine (a wolf's speed, a bite) on your side (`e.side` 1), so it fights as a friend does, goes down instead of
  dying, and gets up. The animals' sheets already carry the wolf; a dog needs Colin, AD's model.
- **The command mode:** Ctrl held (the key is free in the game only while no foe is targeted: Ctrl targets the nearest foe
  today, so the pet's key may want to be another, or Ctrl held longer) shows the yellow ring at the mouse and a word over
  whatever it points at: "Attack" on a foe, "Fetch" on a drop, "Flush" on a bush with a hidden beast, "Stay", "Come", "Guard
  here" on the ground, "Track" on a blood trail (the deer's trail is there already); a click gives the order. The ring and
  the word are the interface's and mine; the pet's own lines (barks) are nobody's.
- **What a pet is for in play:** the hunt (it finds and flushes deer and boar, tracks a bleeding deer, holds a boar so you
  can strike), the watch at night (it wakes you to the wolves, barks at a stranger at your door), a carrier of small things,
  and company on the long walks. Never a meter to feed; a fed dog is quicker, an unfed one slower, as the hird.
- **In the lore:** what folk believe about dogs and wolves is Alistair, LD's to say (the hound at the door, the dog in the
  grave with its master).

## Perks and levelling (Robin's direction, 2026-10-05; not decided)

Robin wants a perk system: you level up and choose between attacking skills from fighting, and choose skills
from the other things you do (chopping, mining, cooking, running). In the end you can get everything, but you
choose from the start.

### Options (Claude)

- **A. Skills that grow by doing, no choices** (Valheim): swing an axe and your axe skill rises; it only gives
  numbers. Fits "from the things you do" but there is nothing to choose.
- **B. One pool of points** (classic RPG): any activity gives experience, you spend points anywhere. Choices, but
  the link between what you did and what you get is gone.
- **C. A craft per activity, each with its own small tree of runes** *(recommended)*. Every activity is a
  **craft** that levels by doing it: Sword, Bow, Shield, Axe (chopping), Pickaxe (mining), Cooking, Running,
  Building, later Sailing and Rowing. Each craft has three tiers of two or three **runes** (the perks). At craft
  levels 5, 10 and 15 you pick one rune of that tier; every five levels after that you may take one you passed
  over. So you choose first, and in the end you hold them all, and what you did is what you got better at.

### What the runes could be (C)

| Craft | Tier 1 (level 5) | Tier 2 (level 10) | Tier 3 (level 15) |
| --- | --- | --- | --- |
| Sword | Follow-through: the third blow sweeps wider / Riposte: a parry opens a free heavy blow | Shield wall: block costs less stamina / Berserk: more damage below half health | **Whirlwind** (active, hotbar): a spin that hits all round |
| Bow | Steady hand: arrows fly straighter / Quick draw: faster shots | Hunter's eye: more damage to animals / Fletcher: arrows are cheaper to make | **Pinning shot** (active): the target cannot move for a moment |
| Axe | Clean cut: trees need one chop less / Splinters: a chance of extra wood | Lumberjack: chopping costs no stamina / Timber!: a falling tree hurts what it lands on | Woodwise: oak and the far island's trees give rare wood |
| Pickaxe | Hard swing: rocks break sooner / Vein sense: ore shows on the chart | Stonemason: stone pieces cost less | Deep delver: a chance of flint and later ore from any rock |
| Cooking | Hearty: meals last longer / Second helping: cook two for the price of one | Feast: a meal shared raises the whole hird | Chef: a new dish at the hearth |
| Running | Long wind: stamina returns faster / Sure feet: sprint is faster | Wanderer: the chart reveals more as you walk | Sprinter: a dash costs less |
| Building | Thrifty: pieces cost less / Sturdy: pieces take more damage | Roofwright: bigger rooms get a roof | Hall: the longhouse pieces |

Active runes (tier 3 of the fighting crafts) are what fill the fight hotbar's slots 1 to 6 (decided earlier: skills on
the fight bar). Everything else is passive.

### Presentation (Claude)
- A **Deeds** section in the leather book (the Book of Beasts has room for sections): one page per craft with its
  level, a bar, and its runes as carved rune stones, dark until taken. Taking a rune carves it. Viking crafts with
  Norse-sounding rune names ("Fylgja" for the follow-through, and so on) would suit the tone.
- A toast when a craft levels ("Axe 5: choose a rune"), the book glows, nothing is forced.
- No overall character level is needed; the sum of craft levels can be the **renown** that the world reacts to
  (recruits, traders, the legendary Vikings hearing of you).

### Questions for Robin
1. Is C the shape you want: a craft per activity, levelled by doing, with a small rune tree each and the choice
   being the order?
2. Should some runes be truly exclusive (never both), or does "in the end you can get everything" hold for all?
3. Do the active fighting runes go on the fight hotbar slots 1 to 6, as decided for skills earlier?

### Robin's shape (2026-10-05): runes you find and slot

Robin: a set number of skill slots, by kind (attacking, utility, mobility, and so on). Skills are **runes** you earn,
find or get from various sources, and you drag the rune you want into a slot to use it. An interface with slots.

Expanded (Claude):

**Runes are things.** A rune is an item: a small carved stone with a skill on it. It sits in the bag like an axe
does, can be dropped, looted, traded, and given by people. That makes skills part of raiding, exploring and
trading at once, which is the game's point. The Item Editor's sibling, a Rune Editor, would make them.

**Slots by kind.** The hero has a rune board with a fixed number of slots, each of a kind:
- **Attack** (2 slots): active skills used from the fight hotbar: Whirlwind, Pinning shot, Shield bash, Berserk.
- **Utility** (2): mostly passive, some active: Hearty (meals last longer), Fletcher (cheap arrows), Clean cut,
  Second helping, Wanderer (the chart fills in as you walk), Night eyes.
- **Mobility** (1): Sure feet (faster sprint), Long wind (stamina back faster), Sprinter (cheap dash), Sea legs.
- **Guard** (1): Shield wall, Riposte, Thick skin.
- **Hird** (1, later): runes that act on your followers: Feast, Rower's song, Shield wall for the whole band.
More slots are earned, not bought: the first attack slot from the first kill, the second from a legend's rune, a
hird slot when you have a hird. A grown character has perhaps nine slots and a bag of forty runes, and chooses.

**Where runes come from** (the sources, each with a feel of its own):
- **Deeds.** The first rune of each craft is earned by doing: fell fifty trees and the axe rune Clean cut is
  carved for you. These are the floor every player reaches.
- **Runestones** in the world (the prop exists): read one and copy its rune. Some stand on the home island, the
  rare ones far away. The compass rule applies: the north's stones carry cold runes, the south's trading runes.
- **Beasts.** A beast slain for the first time can drop its rune (the Book of Beasts already marks the first kill):
  Boar's charge, Wolf's hunger, Bear's hide, Moose's shoulder.
- **People.** Arnor teaches a smith's rune for a favour; traders sell common ones; the first friend in the broken
  village gives the first attack rune.
- **Raids.** Castles and churches keep rare runes in their storehouses; the legendary Vikings carry the best,
  which is a reason to meet them.
- **Rune crafting**, late: two runes of a kind at a rune-cutter make a stronger one.

**Levels without a level.** Runes have a tier (common, carved, legendary) shown by the stone, and a rune in a
slot **grows with use**: an attack rune used a hundred times becomes carved, and its numbers rise. So "level up"
is per rune, from doing, and swapping a rune out costs you nothing but its growth stays on it. This keeps Robin's
"choose from the start, get everything in the end": every rune can be found, but a slot holds one.

**Exclusive by slot, not by rule.** Nothing is forbidden; the board is the limit. Taking Berserk out to put
Whirlwind in is the choice, and it can be undone at any hearth (not in a fight).

**Interface.** A third board beside the character panel and the bag: a dark leather **rune board** with the
slots as carved hollows, each hollow shaped by its kind (a sword notch, a boot, a shield), and the bag's runes
drag into them. A rune in a slot is also shown on the fight hotbar (actives in 1 to 6) or as a small glyph by the
chart (passives). Hover reads the rune: name, what it does, its tier and growth.

**Tone.** Runes are the right Norse thing: the Vikings believed runes carried power, and carving one was a deed.
Names from the futhark where they fit (Fehu for wealth and trade, Uruz the aurochs for strength, Raido the ride
for travel, Algiz the elk for guarding, Sowilo the sun for a torch's light) with a plain name beside them.

### Questions for Robin
1. Runes as items in the bag (drop, loot, trade), or a separate rune book that cannot be lost?
2. How many slots to start with, and are new slots earned (recommended) or always there?
3. Should a rune in a slot grow with use, so "levelling" is per rune?
4. Do deeds (fifty trees felled) carve runes for free, so every player gets a floor?

### Decided 2026-10-05: runes are learnt, not carried

Robin: runes do not end up in the inventory; they are read or learnt in various ways (runestones, deeds, people,
beasts, raids), and they live in a menu of their own, not a book.

Suggestion for that menu (Claude): **the casting cloth**. Vikings cast runes: stones carried in a leather pouch,
poured out onto a cloth to be read. So the menu is a cloth you unroll across the screen (dark leather, a stitched
edge, the same hand as the bag and the book):
- **Left: the pouch.** Every rune you have learnt lies loose on the cloth, grouped by kind (attack, guard,
  mobility, utility, hird), each a small stone with its glyph; dim stones for runes you have heard of but not
  learnt (a runestone seen but not read, a beast met but not slain), so the cloth also tells you what is out
  there. Hover reads it: the plain name, the futhark name, what it does, its tier, how it has grown.
- **Right: the board.** The slots as carved hollows, shaped by kind. Drag a stone from the pouch into a hollow;
  drag it out to the cloth to take it off. Nothing is lost either way, because learnt runes cannot be dropped.
- **Where it opens:** a key of its own (**C**, "cloth"; R is taken) and a small pouch icon by the chart next to the
  book. Changing runes is allowed only out of combat, and the cloth says so when a fight is on.
- Other names if "cloth" does not sit right: the **Pouch**, the **Staves** (runes cut on a staff), **Muninn**
  (Odin's raven of memory: what you have learnt lives in your memory).

## Music (Robin's brief, 2026-10-05; not decided)

Robin wants original music in the style of the early MapleStory soundtrack (2003 to 2005): MIDI-based, expressive
MIDI programming, nostalgic JRPG/MMORPG character, playful melodies, accessible but slightly sophisticated harmony,
a small number of clearly defined instruments (piano, flute or clarinet, celesta or music box, strings, harp,
acoustic bass, light percussion). Free tools: LMMS or REAPER, Surge XT and Vital, Spitfire LABS and BBC SO
Discover, Polyphone with free SoundFonts for the older General MIDI character (preferred over realistic
orchestral libraries), Audacity, Valhalla Supermassive and TDR Nova. Workflow: MIDI arrangement first, then
instruments and SoundFonts, then velocity and timing, then EQ, reverb and mastering. Claude as composition and
production assistant that makes and changes MIDI files and arranges. Analysis of existing tracks (tempo, key,
chords, melody, bass, instruments, structure) as inspiration for wholly original pieces.

### Claude's thoughts

**Two routes, and a hybrid.**
- **A. The DAW route** (Robin's brief): Claude writes MIDI files (a Node script can write a .mid from note data),
  Robin opens them in LMMS or REAPER, picks SoundFonts, renders to OGG. Real mixing and reverb. But it breaks the
  project's rule that there are no asset files (a fine exception if chosen), the loop is slow (every change is an
  export, a render and a listen), and Claude cannot drive the DAW: there is no practical integration with LMMS,
  and REAPER's scripting would be a project of its own.
- **B. The in-code route**: a small sequencer in the game (Web Audio) plays songs written as note data in
  \`src/music.js\` through six to eight synthesized General-MIDI-like voices (an FM piano, a breathy flute, a
  bell for celesta and music box, a soft string pad, a plucked harp, a round acoustic bass, shaker and rim). No
  files, which keeps the rule; the early-Maple character comes from exactly this kind of plain GM voice; Claude
  writes and changes songs directly and Robin hears them in the browser within a minute; a **Song Editor** page
  (play, stop, loop, tempo, per-track instrument, volume, mute, transpose, "Settings as text") lets Robin tweak.
  The ceiling is the synthesis quality: good for the style, not as rich as a SoundFont piano.
- **Hybrid (recommended):** B is the writing room and the preview, with an **Export MIDI** button. A song that
  works can then go down route A for a SoundFont rendering if its sound is wanted, and the game can play either
  the in-code version or an OGG. Start with B; decide on A per song.

**What early Maple sounds like, in rules Claude can compose by** (from knowledge of the style, not from any
specific track): tempos 100 to 140; bright major keys and relative minors (F, Bb, C, G, D minor); eight-bar
phrases in intro, A, A', B, bridge, back to A, looping at one and a half to two and a half minutes; harmony of
I, IV, V and vi with jazz colour (ii–V–I turnarounds, secondary dominants, a sudden key change up a tone for
the B section, major sevenths and sixths on the tonic); a singable lead on flute, clarinet or piano in stepwise
lines with leaps of a sixth at phrase ends; harp or celesta arpeggios in even eighths under it; a root-and-fifth
or walking acoustic bass; light percussion (shaker, rim, soft kick) that drops out in the bridge; strings held
underneath; velocities that breathe (louder at the top of a phrase, softer at the end) and small timing pushes.

**Analysing tracks:** Claude cannot listen. Robin can take a track's tempo, key and chord progression (by ear, or
from a fan transcription or a MIDI of it) and give them to Claude; Claude then writes something original in that
frame. The analysis stays a description; nothing is copied.

**Where music goes in the game:** by place and state, with crossfades: the camp by day (warm, flute), the forest
(celesta, slower), night (sparser, strings), the sea (harp, wide), danger when a beast turns on you (percussion
in, melody out), a village (clarinet, bouncier). Six pieces to start, each looping.

### Decided 2026-10-05
Route B with MIDI export, built (`src/music.js`, the Song Editor). The first piece is the first-biome theme:
comforting, relaxing, happy (Valheim's meadows, Breath of the Wild's calm, in the Maple style), as a day theme and
an evening theme. Combat does not switch the song: it gets more intense, Breath of the Wild-like (a danger layer
fades in). Music is on by default; the volume is in the menu only. **M is not mute: M will be the map.**

What was learnt about the classic Maple tune for inspiration (descriptions, nothing copied): the Ellinia theme is
in Bb major, 4/4, about 122 bpm, three minutes, with around nineteen General MIDI parts (piano on several channels,
nylon guitar, bassoon, finger bass, piccolo, strings, a reverse cymbal); the early soundtrack was composed in-house
at Wizet with plain GM voices, which is where the character comes from. Sources: https://www.midishow.com/en/midi/111583.html,
https://en.wikipedia.org/wiki/MapleStory, https://tvtropes.org/pmwiki/pmwiki.php/AwesomeMusic/MapleStory.

Still open: an OGG per song as an asset later if a SoundFont rendering sounds better; the forest, sea, night and
village pieces; music by place once the island has places.

## Arrows and the quiver (2026-10-13, open)

Robin had the arrow slots removed ("we need to think of a better way") and the bow shoots without ammo for now. Ways to
carry arrows that are not stacks in the bag: a quiver as a worn thing in a gear slot with a count on it (filled by making
arrows; its kind of arrow is the one shot); arrows as a count on the bow itself (the bow's own line: 23 of 30, refilled at a
workbench or from a bundle); a bundle in the belt row; or no ammo at all with a draw time and a limit on how fast one can
shoot (the engine's `cd`), which the sling with stones already is not. The arrow kinds decided on 2026-10-05 (different arrow
types) want the first or the second.

## The beginning: who the hero is (Robin, 2026-10-12; not decided)

Robin: *"Let's make the beginning more immersive. Maybe it should be the classic 'kid survives raid then works for revenge'?"*
The expansion is its own document, **`docs/archive/the-beginning.md`**: three ways to tell it, who the hero is, what revenge means in
play, what it costs, six questions. Nothing is decided.

## The starter island: what the play-through left open (2026-10-12)

Measured by script (`tools/visual/startplay.js`); Robin has not ruled on any of these.

- **Pace.** A pine gives 12 wood in fifteen seconds and a furnished hut costs 44: the first home is a few minutes' work. Good
  for a first hour, or too quick to feel earned?
- **How many animals.** Counts scale with area, so the 120-tile island holds 16 boars, about 20 deer and 12 adders. It was
  tuned at 60 tiles with 4 and 5.
- **Young boars.** My call, so that a wooden club can win a first fight (6 health, 7 a blow). The other way would be a
  stronger club, or a boar that leaves you alone unless you come close.
- **Death costs nothing.** You rise at the wreck with everything you carried. Fits "reward, not punish"; but then a wolf pack
  is no threat either.
- **The bow.** The scripted hunter lost a deer to ten arrows. A hand on the mouse will do better; worth a try by Robin.

## House sizes: a proposal (2026-10-13; Robin: what sizes of houses are reasonable, for play and for immersion)

**Built the same day** (Robin: "Fix the house sizes so that they make sense. I feel like they are way too small today"): the
proposal below is what `src/village.js` now grows, with the church a tile wider (4 by 8 or 9) and the steading on the starter
island enlarged to match. What is still open is at the end of this section. `CLAUDE.md`, "House sizes", has what the code does.

Not decided when written. A tile is 1.5 m; the hero is 1.8 m and 12 units across (a man 14); the screen shows about 19 by 12 tiles.

**What was real** (looked up; sources in the session's answer): longhouses were about 5 to 7 m wide and 15 to 75 m
long, the width held down by what a roof could span; Dublin's tenth-century town houses averaged about 9 by 6 m;
Hedeby's houses were about 17 m long and 3.5 or 7 m wide; the Trelleborg type about 30 by 8 m; the hall at Lejre 48 by
11.5 m (a later one 61 by 12), Borg in Lofoten 83 by 9.5; pit houses about 4 by 3 m; Escomb's nave 13.3 by 4.4 m inside.
In tiles: **nearly everything people lived in was 2 to 5 tiles across**, and its size was its length. Only a king's
hall was 6 to 8 across. A house of 6 by 6 tiles (the trial's) is a shape nobody built.

**What play needs**, measured on generated villages (`node tools/roomsize.js`: for every room, the floor the hero can
stand on and the widest circle of clear floor). Two men at a sword's distance are 1.5 tiles of floor; the hero's dodge
is 1.6 tiles; two attackers flank over about 2. So a clear circle **under 2 tiles** is a room one man corks, **2 to 3**
is toe to toe with no dodge, **3 or more** is a fight with a step in it, **4 to 6** takes several a side.

| Room (tiles) | Metres | Clear circle | |
| --- | --- | --- | --- |
| house 3x3 to 3x5 | 4.5 x 4.5 to 7.5 | 1.7 to 1.9 | a quarter of today's houses |
| house 4x4, 4x5 | 6 x 6 to 7.5 | 2.2 to 2.3 | two thirds of today's houses |
| house 4x6 | 6 x 9 | 2.8 | |
| house 4x8 | 6 x 12 | 3.6 | |
| house 6x6 (the trial) | 9 x 9 | 3.4 | |
| longhouse 3x9 to 3x11 | 4.5 wide | 2.2 to 2.6 | |
| longhouse 4x9 to 4x11 | 6 wide | 2.9 to 3.3 | |
| hall 4x13 to 5x15 (today) | 6 to 7.5 wide | 3.6 to 4.7 | |
| hall 6x20 to 6x23 (the trial) | 9 wide | 5.9 | |
| hall 8x20 (the trial) | 12 wide | 7.9 | a king's span |

The things inside are the same five whatever the size, so **length buys clear floor as well as depth does**: 4 by 8
gives what 6 by 6 gives, with less floor and a roof that could be built. Today no house reaches 3 tiles of clear
floor; the generator's jitter makes over a quarter of them 3 across, and one in fifty 3 by 3, which is under the
standard of 2026-10-09 ("4 by 3 at least").

**The proposal: narrow and long, gable to the yard.**

| | Today | Proposed | Why |
| --- | --- | --- | --- |
| House | 4 to 5 by 3 to 4 (jitter: 3 to 6) | **4 across, 6 to 8 long** (6 by 9 to 12 m), never 3 across | the Dublin and Hedeby house; a duel fits; the door on the short end to the yard, so the yard, the ring and what is heard stay as they are |
| Longhouse (a farm's) | 9 to 12 by 3 to 4 | **5 by 14 to 18** | room for the hero and a friend; still fits the screen |
| Jarl's hall | 13 to 16 by 4 to 5 | **6 by 20 to 22**, two rows of posts | the Trelleborg class; the hall-men's fight fits; eight seconds to its far end and twelve back with a chest, which is the raid's "deeper in"; 22 is what the view shows when a big fight draws it back |
| Church | 3 to 4 by 5 to 6 | **3 to 4 by 8 to 9**, a small chancel | Escomb |
| Pit house, store, smithy, bath | 2 by 2, 3 by 2 | as they are | real pit houses were 4 by 3 m |

Open: **furnishing by length** (side benches and beds along one long wall and the ends, the hearth off the middle
line: real houses had benches down both sides and two metres of floor, which is the one place play and history pull
apart); whether a roof should have a **widest span** without posts when the player builds (posts are an option today);
and whether your own first hut (4 by 3) should read as a hut beside a village's houses, which this would make it do.

## Four big problems: the year, the scale, a living world, the great towns (Robin, 2026-10-14; thoughts, not decided)

Robin asked (2026-10-14): how the islands resetting at the new year makes sense for the player; how a huge world of massive
islands and lots of sea makes sense in a 2D game, where scale is strangely hard; how the world feels alive; and whether there
should be a few massive handcrafted towns with big jarls beside many generated ones. These are my thoughts with a recommendation
each. **Nothing here is decided.** The questions for Robin are at the end.

### 1. The year turning

The reset should never touch the land, only the people. Coasts, mountains, caves and groves stay, so what the player learned
exploring stays true. What turns over is the settlement layer, and it should turn over by cause, not at random:

- **A place nobody touched grows:** a house or two more, a wall it did not have, a new jarl when the old one dies. The player
  comes back and recognises it, changed.
- **A place you sacked is rebuilt** by whoever moves in: survivors who remember you, or strangers who do not. This is the
  regenerated case, and it reads as a consequence of your own raid.
- **A place you emptied of people decays to a ruin**, and a ruin is resettled some years later (the starter island's steading is
  what that looks like).
- **A place you hold never turns over.** That is the whole reward for claiming, and the hird defends it.

The year wants a rhythm the player feels, not a counter: summer the raiding season, autumn the haul home, winter at home with
storms that make sailing foolish, spring the news. **The year ends when you winter at home**, so it is the player's choice, and
the world's loot refills with it: a church raided this year has its silver again next year. The player learns what changed
through rumour and the chart, never a popup: a trader says Steinarsheim has a stone wall now; on the chart a place seen last
year fades to a question mark until it is seen again (the map shows nothing until seen, decided 2026-10-07).

### 2. Scale in two dimensions

Why it feels hard: in 3D you see the mountain from far off; top-down you see one screen of 29 by 18 metres and nothing beyond
it, so distance can only be felt through travel time, the map and signs of things you cannot see. Three levers:

- **The sea is the huge thing, the islands are dense.** Walking stays an adventure of obstacles (decided 2026-10-09). Sailing
  is where size lives: the camera pulls out under sail so the hull is small on a big sea, crossings take minutes, and a crossing
  eats a day of the calendar. A long crossing with nothing in sight can run the clock faster until something is sighted, so a
  voyage feels long without being tedious.
- **The chart is the horizon.** In a 2D game the map is where scale is seen: it fills in as you sail, keeps your track, and shows
  nothing you have not seen. The unknown edge of the chart is what makes the world big, not the number of tiles.
- **Signs from afar:** smoke columns drawn tall enough to show over the trees before the village does, a beacon fire at night, a
  sail on the edge of the sea, a bell heard before the church is seen. These give the far-off presence 3D gets for free.

Sizes to try: lowland islands two to three times the big island, several places each, reached along the coast by boat rather
than overland (Vikings sailed; coasts are the roads), and seas of several minutes under sail. The longship already longer than
the screen and towns wider than it are the right kind of cue.

### 3. A living world

Alive means things happen without you, things remember you, and the player can see both. Cheapest first:

- **Other ships.** Three to five vessels moving between jetties on their own errands, a fishing boat off every hamlet, a patrol
  from the trading hub, now and then a rival raider's sail. Nothing makes a sea alive like something else on it.
- **A world tick once a game day.** Each place's state advances: wealth grows, a garrison recruits, a sacked town rebuilds, a
  jarl ages. News of events spreads by ship from place to place and people's lines draw on it; the legendary Vikings' names can
  travel the same way (the open question of 2026-10-04).
- **Warning beacons** along a coast that light when your sail is seen, so the next town is ready. Real Viking-age practice
  (vardar), and it makes the approach to a raid a decision: by night, from the far side.
- **Seasons you can see:** autumn colours, snow, fog, the sea state. Also how the year's turning becomes visible.
- **Wildlife with its own business:** wolves hunting deer rather than only you, birds over a carcass, seals on a skerry.

### 4. Handcrafted or generated towns

Both, with a clear split. **A few handcrafted anchors**: the trading hub and perhaps three or four great seats, each with a named
jarl, a story, a legendary Viking and a reason to go there. These persist across years and change by story state rather than
regeneration. **Everything else generated** from archetypes as the Village Editor already does, the names and the compass rules
deciding what kind of place stands where. The anchors are still placed by the generator, so their position differs each world,
with their surroundings generated and only the town itself hand-laid. The Village Editor can save a design, so a handcrafted town
is a saved layout plus a sheet of people, loot and lines: cheap to build, and the world gets memorable places without losing
freshness.

### Robin's answers (2026-10-14; these are the direction, also in CLAUDE.md)

1. **Seasons Stardew Valley style, but the player decides when a season moves**, at a moment at the end of every season. It
   must not be abusable, and the player must not feel stressed about seasons moving: how that balances is to be worked out.
   **Seasons should feel different and give access to different things and mechanics.** The whole time and season aspect is
   to be worked on later.
2. **A system of "controlled randomness".** A destroyed village or town may, after winter, be **rebuilt by survivors and be
   stronger**, be **scavenged by bandits who make it their home**, or **fade away and be overtaken by nature**. And **every
   island gets events generated after winter**: people settling and making a small village (boats by the shore and a path up
   to it); trolls moving into a new cave (the cave changes, not the layout); new creatures showing up, such as Näcken;
   destroyed villages rebuilt in various ways; villages and towns that were not raided expanding and getting bigger.
3. **The camera pulled out under sail: yes.** A faster clock: not sure; later, with the time and season work.
4. **Nothing handcrafted**: everything generated in a controlled way (so no anchors; the hub and the great seats are
   generated too, with their jarls).
5. **Warning beacons: a good idea**, kept here as an idea (not decided when they come).

Open after the answers: what the moment at the end of a season is (a feast? the first snow? sleeping at home?) and what
stops it being abused; what each season gives and takes; the list of after-winter events per island and their odds (the
controlled randomness: which outcomes a sacked place can have by what happened to it); bandits as a people (who they are,
what they hold, whether they raid); what a troll's move does to a cave; how Näcken and the other väsen arrive.

## Pier pieces and the small shipyard (Robin, 2026-10-30; Colin, AD's three drafts asked for, waiting for Robin's pick)

The shipyard becomes a smaller thing built into a pier, with pier pieces to build from. **Robin's rule: pier pieces are limited by the water, so that you have to build at the beach** ("some sort of limitations when building, like with the shallow and deep water").
Mine, to settle when it is built: a pier starts from a beach (a first piece touching sand, not rock or a cliff's foot), each next piece joins the pier and stands in the shallows (`w.isWade`), and none stands in deep water, except perhaps a last end piece one step past the wading line, so a ship can lie alongside. Today's Dock floor goes on any water beside land or another dock, so this rule is new. It has to fit the wade band's varying width (about 1.5 to 4 tiles) and the villages' jetties, which are generated and keep their own rule.

**Robin, the same day:** **the boat being built shows up outside the pier in the water, whichever way the pier runs, so you always see the whole boat side-on**; the limits on how far a pier reaches keep it easy to see and clear of the pier. **Pier pieces may reach 1 or 2 pieces inland if they connect to a piece in the shallows.** The shallows may be widened ("You might be right").
Mine, to settle when built: the hull's place is found along the pier's seaward side where a side-on hull fits on water clear of land and of the pier (the sprites' side view, east or west, whichever fits), and the yard cannot be used, with a plain reason, where no place fits. Widening the shallows moves `wadeDepth`, which changes wading, the swim, the beasts' hunting ground and how the shore is painted, so it needs its own check.

**Robin, the same day:** the boat is placed in **the closest free water**, and the player must not be able to lock himself in by building somewhere narrow.
Mine, to settle when built: a spot counts only if it passes a way-out check: from the spot, a search over the water (with a margin of the ship's width, around land, piers and other solid things) must reach open sea. The yard takes the closest spot that passes, and with none it says so before any material is paid, not after. The check runs for the ship being built, so a narrow creek can launch a rowboat and refuse a longship. Piers built later can still shut a bay: a pier piece that would cut a ship of yours off from the open sea is refused, or, simpler, pier pieces can always be taken down. Last resort for any boat stuck by anything: a "tow her out" at the yard, or the ship's own place moved to the nearest water with a way out.

**Robin's pick, 2026-10-30: draft C, the work stage** (a pier on stone-filled log cribs, a railed cross-stage at its end; `docs/pictures/pier/pier_drafts_board.png`), and he asks for variations of it with better looks (asked of Colin, AD the same day).

**Robin's pick, 2026-10-30: C3, the short head** (`docs/pictures/pier/pier_c_board.png`), minding two things: **piers tried in many shapes and on every side of an island, so nothing clips or looks wrong; and no stairs on the pieces: a rope ladder or net you build where you want to climb up from the water, shallow or deep.** Colin, AD has the assembly board to make first.
Mine, to settle when built: the deck is a level of its own (0.72 m up, as a storey's lift): the pier's sides stop you in the water, you get on from the landing on the sand or at a ladder (E), and you step or drop off the side into the water. Beasts stay off it unless they come by the landing. Every shape Colin, AD's board shows cannot look right is refused by the placement rule.

**Robin, the same day:** beasts and men **can go on the pier**, and **must be tried there: fights on and round a pier, by play and by bots, before it is called done.** Entering a boat makes them leave (built, `api.afloat`, `docs/state/combat.md`).

**Built 2026-10-30:** the above is in the game (`docs/state/game.md`, "Piers and the small shipyard"). Still open: widening the shallows; a tow for a boat shut in by a later pier.

**Flint on the beaches** (Robin, 2026-10-31, for chapter 1): flint gathered along the beaches, from the big island and the other non-starter islands nearby. Not built.
