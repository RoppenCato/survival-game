# Lines the game speaks with no lore id yet (2026-10-25, for Alistair, LD)

Every line a person says that lives in the game's code and not in `assets/lore/lore.json`. Interface words are left out: prompts over
the hero ("Cast", "Hook it", "Set it down"), toasts and big-step boards are the Game Developer's. The year's season lines in `YEAR.line`
are only a fallback for `line.year.opens` and are left out too. Line numbers are `templates/game.html` on the day this was written; the
function names will outlive them.

Proposed ids are the Game Developer's suggestion, in the canon's pattern. Setting is where and when the line is heard, in the terms
of the staging list at the end.

## Villagers (any peaceful place)

| Proposed id | Speaker | When | Setting | Lines (mode) | Code |
| --- | --- | --- | --- | --- | --- |
| `line.folk.chat` | a villager | talked to (E), a pair a person | village.green, day | 9 pairs, told a line a talk: "Fair winds brought you, or foul?" / "The well is sweet here. Drink if you like."; "My brother went east with the traders. Rivers all the way, he said." / "East is trade. West is nothing but sea."; "Colder north of here than you would think." / "Keep a fire. Keep a roof. The rest comes."; "You will find no work here, but no trouble either." / "We mind our own."; "The hall in the south has silver on its walls, they say. And a hundred spears round it." / "Churches have less spears."; "Wolves took two sheep last moon." / "They come at night, from the dark wood."; "You built that raft yourself? It floats, so it is a boat." / "A keel next. Then you can go somewhere."; "There is a troll in the hill cave. We leave it be and it leaves us be." / "Do not mine there at night."; "Ormr's men came by last winter. We paid them in wool and they left." / "Pay, and they leave. Fight, and they burn." (the last overlaps `line.folk.ormr`) | `FOLK_LINES` |
| `line.folk.wary` | a villager | the hero's blade was out and seen in the place, for a while after | village.green, day | variants: "Keep that blade where it is." "You frightened the children." "We want no trouble here." | `WARY_LINES` |
| `line.folk.cower` | a villager, hiding or cornered | during a raid, the hero close | raid.village, any time | variants: "Take it. Take all of it." "Not the children." "We have nothing. Nothing." "Gods, not us." "Leave us be." | `COWER_LINES` |
| `line.folk.raided` | a villager of a place raided before | talked to after the raid | village.green, day | variants: "You again. Take what you want and go." "We have nothing left. You saw to that." "The jarl will hear of this. Everyone will." | `RAIDED_LINES` |
| `line.folk.mourn` | a villager of a place where the hero killed someone | talked to after | village.green, day | sequence with slots: "You killed {dead}." then "{count} of us. {count}." (more than one dead) or "{dead} never lifted a hand to you.", then "There is blood on you. Go." | `mournLines` |
| `line.folk.homeless` | a villager whose house burnt | after a fire | village.ruin, day | variants: "It is gone. All of it." "Where are we to sleep now?" "My father built that house." | `HOMELESS_LINES` |
| `line.folk.fire` | a villager seeing a fire | cried as the brigade runs | village.well, any | variants: "Fire! To the well!" "Water! Water!" | `brigadeTick` |
| `line.folk.thief` | a villager or a man who sees a theft | a chest taken from, a beast of theirs killed | village.yard | "Thief! Thief!", "Thief! Hold him!", "Thief! The beasts!", "Thief! My {beast}!" | `theftSeen`, `stockKilled` |
| `line.folk.body` | a villager who finds a dead man | a body found | village.yard | "Murder! Murder!" | `bodiesFound` |
| `line.priest.keys` | the priest, cowering | his keys taken (E) | church.nave | "Take them. Take them and go." | `takeKeys` |

## The place's men

| Proposed id | Speaker | When | Setting | Lines (mode) | Code |
| --- | --- | --- | --- | --- | --- |
| `line.gate.*` | the gate's man | the hero comes to a walled town's gate | town.gate | night: "The gate is shut till morning."; with men behind him: "You alone. Your men stay out there."; armed: "No blades inside the walls. Leave them at your ship."; word has spread: "We heard what you did at {place}. Go on in, and keep your hands where I see them."; at peace: "Go on in." | the gate check (`gateMen`) |
| `line.men.challenge` | a man of the place | a drawn blade in a place at peace | village.green | "Put up your blade." then "Keep it there." | the menace check |
| `line.men.alarm` | a man of the place | the alarm | raid.town, any | "To arms!", "To arms! To arms!", "Raiders! Raiders in the town!", "Who goes there? To arms!" (the night watch), "Raiders! To arms!", "A dead man! To arms!", "One of ours is dead! To arms!" | `raidAlarm`, the watch, `bodiesFound` |
| `line.men.yield` | a man of the place, badly hurt and not loyal | he yields | raid.yard | "I yield." | the engine's yield, the page's bubble |
| `line.men.spared` | a man let go (E) | he runs | raid.yard | "I will not forget this." | `letGo` |
| `line.men.takeback` | a free man of the place | he carries a dropped heavy thing home | raid.yard | "Ours, that." | `takeBackTick` |

## The hird and Arnor as hirdman

| Proposed id | Speaker | When | Setting | Lines (mode) | Code |
| --- | --- | --- | --- | --- | --- |
| `line.arnor.joins` | Arnor | the first claim stone raised at Thorgunna's | steading.stone | "A stone stands again at Thorgunna's. Then I am yours, and this bench is mine." | the claim |
| `line.hird.stone` | a hirdman | made keeper of a stone | home.stone | "I will keep this stone." / "I will hold this stone." | the claim, the muster |
| `line.hird.order` | a hirdman | given an order (G): follow, a job | home.yard | "Lead on." "Lead on, then. Slowly. There is nothing in the stores." (hungry) "I can do that." "I will keep by the stone." | `hirdTalk` |
| `line.hird.bounds` | a hirdman | told to follow outside your land | home.edge | "Not out here. Call me at the stone." then, at the edge, "This is where I stop." | the territory rule |
| `line.hird.board` | a hirdman | boarding | shore.ship | "To the oars." (the first aboard), "No room for me aboard." (the ship full) | `crewBoard` |
| `line.hird.carry` | a hirdman, a man of yours on a raid | ordered to carry (G) | raid.yard | "I have it." "I have him." (a downed man) "No room aboard." "Stowed." | the carry errand |
| `line.hird.wall` | a man of yours | ordered to hold (G held) | raid.gate | "We hold." (the line) "I hold." (one man) | the hold order |
| `line.hird.ram` | a man of yours | the ram taken up | raid.gate | "Shoulders to it!" | `ramTick` |
| `line.hird.freed` | a man of yours, bound by the place that took him | his bonds cut (E) | raid.hall | before: "They have had me at the quern. Cut me loose."; after: "I knew you would come." | `boundHere`, `cutLoose` |
| `line.thrall.freed` | a thrall of the place | cut loose (E) | raid.yard | "I row, I dig, I fight. Yours." | `cutLoose` |

## Words that are not a person's

Shown on the speech board with a heading: "Carved in the stone" (Thorgunna's stone) and "Scratched in the rock" (by Hogni). The words
under them are already canon; only the two headings are in the code, and they are interface words (mine) unless you want them.

## Staging list (what a Dialogue scene could put on screen)

For each line a setting the game can stage: `place` is one of these, `time` one of dawn, day, dusk, night, `season` optional (summer by
default), `speaker` a lore person id (`person.arnor`, `person.aslak`) or a role (`villager`, `villager.farmer`, `villager.smith`,
`priest`, `thrall`, `man.gate`, `man.watch`, `man`, `hirdman`), and `with` what else stands there if it matters (`fire`, `blade drawn`,
`men behind`).

- `wreck.beach`: the starter island's beach by the wreck
- `steading.yard`, `steading.graves`, `steading.well`, `steading.stone`: Thorgunna's burnt steading
- `home.yard`, `home.stone`, `home.edge`: the player's own place (staged at the steading mended)
- `village.green`, `village.well`, `village.yard`, `village.ruin`: a peaceful village (Old Aslak's on the big island)
- `town.gate`: a walled town's gate (the Battle test's town)
- `raid.village`, `raid.town`, `raid.yard`, `raid.hall`, `raid.gate`: a place being raided (the Battle test's)
- `church.nave`: a church and its priest
- `shore.ship`: a shore with your ship drawn up
- `sea.aboard`: aboard at sea
- `cave.troll`: the troll's cave
