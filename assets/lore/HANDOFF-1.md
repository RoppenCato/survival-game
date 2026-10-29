# Lore handoff 1: the reworked start (2026-10-16)

From the Lore Director to the Game Developer, under `docs/integration.md` (Robin approved it 2026-10-16). Everything here is
**canon**: Robin decided it on 2026-10-16. The full record is `canon/CHANGELOG.md`; the reading site has every entry.

## Copy

`out/lore/lore.json` → the game's `assets/lore/lore.json` (66 entries: canon and in-game only). Inline it as `__LORE__` when
you are ready. Until then, the strings below can be copied by hand, as we agreed for the first lines.

## What Robin decided

1. **The hero's past is never explained, and the player picks his name.** He drifts ashore or wakes beside a broken boat.
   (`story.hero`) A name entry at the start is yours to design. Lines never say his name.
2. **The raider is Ormr Midgardbane**, not Ragnar Ironside. Folk say the World Serpent fears and respects him, so storms
   leave his ship alone, and some say he can call the Serpent up to rule the sea. Nobody knows why or whether it is true.
   His raiders always leave one survivor to tell the story. (`person.ormr`)
3. **The survivor is Arnor, the village smith**, not Brokk. He is an ordinary man, not a dwarf. When the hero comes, Arnor is
   in the burnt village scavenging and fixing what he can. He keeps Brokk's place in the game: the story, teaching the raft,
   the first hirdman. (`person.arnor`)
4. **The burnt steading was Thorgunna's**, not Hildir's. She would not pay, and died at the door of her hall with her two
   sons. (`person.thorgunna`, `place.burnt-steading`)
5. **The dead Viking in the troll's cave is Hogni.** Forty winters ago he went into the hill with his brother, **Old Aslak**,
   who now lives in the first village of the big island and tells the story at the fire. Hogni wore their father's bronze
   ring. (`person.aslak`, `person.hogni`, `thing.bronze-ring`)

## Renames in the game's strings

| Where | Today | Becomes |
| --- | --- | --- |
| `brokkLines`, the speech board's speaker name, anything showing "Brokk" | Brokk | Arnor |
| `FOLK_LINES` | "Ragnar's men came by last winter. We paid them in wool and they left." | "Ormr's men came by last winter. We paid them in wool and they left." |
| `ROLES.elder` (src/village.js) | "Ragnar's men came once. They will come again." | "Ormr's men came once. They will come again." |
| The `bigStep` banner (yours) | "Day N. Ragnar sailed east." | Your words; "Ormr sailed east." keeps it as it was |
| Comments and docs | Hildir's steading, Brokk, Ragnar Ironside | Thorgunna's steading (the burnt steading), Arnor, Ormr Midgardbane |
| Name pools: `NAMES`, `FIRST` (src/village.js) | Orm | remove (too close to Ormr) |

Arnor, Ormr, Thorgunna, Aslak and Hogni must never come out of the name generator.

## New lines (replace `brokkLines` and add two speakers)

Each line is under 130 characters. Slots: none. Robin's rule as always: people speak in their own voice.

**Arnor, meeting him** (`line.arnor.meet`, in order, one per press of E; replaces `brokkLines('meet')`):
1. You came from the sea with less than I have. I didn't think that could be done.
2. Arnor. I was the smith here. Two winters back Ormr Midgardbane came up the sound and left us this.
3. He always leaves one. Somebody has to tell it, he said. So here I am, telling it.
4. The plank house by the well still has its bones. Put walls on it before the dark, if you mean to stay.

**Arnor, while the home lacks something** (replaces `brokkLines('wait')`; one of each set, picked by the lack):
- no walls or roof (`line.arnor.wait.no-walls`): Walls and a roof first. The nights here are not kind. | Four walls and a
  roof. Everything else is only weather. | I've mended three roofs here since. Nobody to sleep under them. Change that.
- no hearth (`line.arnor.wait.no-hearth`): A fire in it. A roof without a fire is a cave. | Cold iron takes no shape. Cold
  men neither. Give it a hearth. | He broke my forge. He didn't think to break the hearthstones. Use them.
- no bench (`line.arnor.wait.no-bench`): A bench to work at. Hands alone make poor tools. | At a bench I can make anything.
  Without one I'm a man with a hammer. | Somewhere to sit and mend things. A house where nothing is mended falls down.
- no rug (`line.arnor.wait.no-rug`): Something on the floor. A house is not a home until it is warm underfoot. | Bare
  boards. Thorgunna would have laughed you out of the hall. | Put a hide down. Cold feet make a man stupid, and you've no
  wits to spare.

**Arnor, teaching the raft** (`line.arnor.teach`, in order; replaces `brokkLines('teach')`):
1. That is a home. Good. Sit a while. First one I've seen here in two winters.
2. Logs, and rope. Three logs lashed together will carry a man across the sound.
3. A bench on the sand, by the water. Then east, past the big island. That is where his sails went.

**Arnor, after the raft is taught** (`line.arnor.taught`, one of): The bench on the sand. Lay the logs, and mind the sea. |
Tell them on the big island you met Arnor. They'll know the rest. Everyone does. | I'll be here. Somebody has to keep the
graves.

**New situations, if and when you build them** (the event is yours to decide):
- At the graves behind the hall, once (`line.arnor.graves`, in order): Thorgunna, who would not pay. Her two boys beside
  her. Grímhild, who kept the bees. Thorkel the boatwright. | I cut her runes myself. They're crooked. She'd have laughed at
  them. | You see? Somebody stands here, and I tell it. Every time. He knew I would.
- At the shore as the raft first leaves (`line.arnor.shore`, one of): Go on, then. And if you hear his story told
  somewhere, tell them how it ends here. | East. Come back with somebody. This place could use a second voice.

**Old Aslak**, a fixed villager in the first village of the big island (the generator places him there):
- Before the ring is found (`line.aslak.story`, in order over several talks): My brother and I went into the troll's hill
  when we were young and stupid. I came out. | Little ones in there, all hair and nose. They bonk the stone with bones. Leave
  them be. | We didn't. One cried, and the father came. I ran for the light. Hogni ran the other way. | He had our father's
  ring on. It's in there still, past the big one's bed, if the troll left him an arm.
- The first talk while the hero has the bronze ring (`line.aslak.ring`, in order): That's his. … That's our father's ring. |
  Keep it. He'd want it to see daylight. | He could whistle through his fingers louder than any boy on the island. I'd
  forgotten that.

**Villagers anywhere, about Ormr** (`line.folk.ormr`, pairs, one pair per villager, like `FOLK_LINES`):
Ormr Midgardbane. Say it quietly. They say the sea listens to him. / The storm that sank my cousin went round his ship like
water round a stone. — They say the Serpent fears him. I say the Serpent has more sense than we do. / Pay him. Everybody
pays him. The ones who didn't are a story now. — Every place he burns, he leaves one alive. To tell it. / So we'd know what
we're paying for.

## Places to touch, for your reference

- The dead Viking's spot behind the lair: a scratch on the rock beside him, if you show text there: *"Hogni. Tell Aslak to
  run faster."* (`person.hogni`)
- Thorgunna's grave behind the burnt hall, if you mark one: *"Arnor raised this stone for Thorgunna. She did not pay."*
  (`person.thorgunna`)

## Not in this handoff

Everything still `proposed` stays out: the realm's name, the high seat, the houses, the gods' signs, the name pools by region.
They wait for Robin.

Please reply with what you took.
