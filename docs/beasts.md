# The beasts: the rules

**The lore lives with the Lore Director** (`C:\dev\SG\Lore Director\canon\beings.md`, `beasts.md`, `legends.md`; the
agreement Robin approved on 2026-10-16 is its `docs/integration.md`): what each creature is, its folk name, what folk say
about it, the warning signs folk know, its look. **The lore says what folk believe; the game decides what is true.** This
file keeps only the game's side: what is built, the mechanics **Robin** gave (marked as his), my suggestions (not decided)
and what is open. Each section names its canon id. Text the game shows (the Book of Beasts cards in `BESTIARY`, lines)
comes from the canon as it is delivered; until then the cards in `templates/game.html` are the game's own ("in-game" in
the canon). A page in the book is earned the first time you slay a creature; weaknesses should be real rules in the fight;
trolls and the other väsen look like the old illustrations, hairy, heavy and long-armed, never cute (Robin).

The six animals of the first biome are in the game (`beast.boar`, `beast.deer`, `beast.wolf`, `beast.bear`, `beast.moose`,
`beast.adder`); their mechanics are in CLAUDE.md ("Beasts") and `src/combat.js`.

---

## Mountain troll (`being.bergtroll`)

**Built:** the cave troll on the big island (the boulder troll's sheets): lives at the back of his cave, walks out on some
nights, shields his eyes from a hearth or brazier, turns to stone at dawn if caught provoked and cracks into a rock of ore,
walks home at morning, keeps a hoard of copper. **Since 2026-10-16 he senses his young** (see Hårungen below) and comes for
you when they are struck again and again, when three are killed, when he sees you in his cave, or by a chance that grows
with every ore you mine; hunting, he follows the passage to you. His blow is a great slow sweep (`ATTACKS.troll`).

**Robin's mechanics (2026-10-05):** active only at night. At dawn it turns to stone, then cracks and crumbles away. It also
appears in caves at any hour, where it is dark; it is sensitive to light. Ore is the troll's domain: ores are found in caves
and outside them, but outside a cave by day they are rare and only found by chance, and at night the stone that holds ore
glows faintly. The troll is a threat to mining.

**Suggestions (not decided):**
- A torch or brazier in a cave gives light the troll will not enter (he stands at its edge and growls), so lighting a cave
  is how you mine it safely; torches burn down.
- A `slam` that cracks the ground and throws a ring of stones you can mine for ore, so even his attacks feed the loop. He
  heals on bare rock, so the fight is to pull him onto grass.
- A stoned troll can be read like a runestone once (the "troll stone" rune).
- A lit torch held up makes him cover his eyes for a second: a stun window, the troll's parry.

**Drops (built):** 3 copper and 3 stone killed; a rock formation worth 6 stone and 4 copper when stoned.

**Open:** how much ore one troll guards; whether he follows you out of the cave into the night.

## Hårungen, the troll's young (`being.harungen`)

**Built (Robin, 2026-10-16):** five live in the troll's cave. They walk about, bonk at the ore rocks and veins with their
bones (it gives nothing) and idle; they step aside if you come close. Friendly unless attacked: one struck turns on you, and
so does every other young that can see it. The troll senses it (above). A lost young comes back each dawn while the troll
lives. The art studio's model (half the hero's height, a mop of hair, a gnawed bone); 8 health, 6 a bonk; drops a stone and
now and then a copper. The numbers are mine (`UNGE` in `templates/game.html`).

## The other trolls: Trollmor (`being.trollmor`), the haug troll (`being.haugtroll`), the Gape (`being.gapet`), the three-headed troll (`being.trehodet`)

**Built:** the Gape and the three-headed troll are Blender models (2026-10-12, my designs: Robin asked for two new trolls,
horrifyingly evil); they fight in the Combat Arena and are spawned nowhere in the game. Trollmor and the haug troll are the
art studio's redesigns, not dropped in.

**The Gape (suggestions, not decided):** it sits back and the lid of its head comes all the way up (a long tell), then
lunges and bites (`ATTACKS.trollMaw`); 110 health, slow to turn. Where: a sea cave reached only by boat, or a far island's
tide line at night. It sees only on one side: come from the blind socket and it notices you later. It should not chase far
from water. Reward: something from its gullet.

**The three-headed troll (suggestions, not decided):** the mountain troll's sweep, faster, with longer arms; 130 health. Each
head must be dealt with (three kills, a head hanging limp after each, faster and wilder), or the heads quarrel (the hag sees
you, the skull decides, the small one screams at night so you hear it long before you see it). A big event of a later
island. It does not turn to stone at dawn unless Robin wants every troll to.

## Draugr, huldra, Näcken, bysen: Robin's looks (2026-10-12), modelled in Blender, the mechanics still to discuss

**Robin's looks:** the **draugr** is the walking corpse of a drowned Viking, man-sized, with a sword and a shield; the
**huldra** is beautiful, in bright colours (a red dress, fair hair), with the back of a hollowed rotten tree trunk and no
tail; **Näcken** wears forest clothes and carries an instrument (a lyre: the Viking-age instruments come into the game this
way) and **belongs in a lush forest**, by a forest stream or pool, not the fells (Robin, 2026-10-12); the **bysen** is small
and tomte-like, chops slowly at trees, and turns into a wooden stump when you come near; axe the stump and you get a larger
amount of wood and some sort of magic piece of wood. In the Art Editor and the Combat Arena; spawned nowhere.

## Bysen (`being.bysen`)

**Robin's mechanics (2026-10-05):** confuses the player somehow; he must be made to lose the way home. (2026-10-12: he turns
into a stump; axed, a lot of wood and a magic piece of wood.)

**Suggestions (not decided):** confusion as *the chart lying*, not the controls breaking (controls that fight you punish; a
map that fools you is a puzzle). While he has you the chart's hero dot drifts a little further each second and the home
marker slides round the island; the forest repeats (a copy of the grove you just left drawn ahead of you, so walking forward
looks like walking in a circle). The spell breaks when you leave the forest for open grass, cross a stream, stand still and
look for ten seconds, or turn your cloak inside out (a rune or a panel action, learnt from Brokk or a stone). A line of
felled trees is a barrier he does not cross.

**Open:** what the magic wood does; whether he is harmed or only runs off; whether the drifting chart is too mean on a big
island (a cap on the drift); whether he can appear before the player has a chart.

## Shapeshifter (`being.hamnskiftare`)

**Robin's mechanics (2026-10-05):** a rare thing the player stumbles upon.

**Suggestions (not decided):** one in forty animals placed on an island is a shapeshifter: it uses the animal's mind and
drawing until struck or until you stand by it a while, then rises into a person with a weapon (the people's sheets): a man
fight. Spare it (no blow for five seconds while it stands with its hands up) and it offers a trade or a tale; kill it and you
get its skin, worn in the amulet slot: hold the key and you are the animal for sixty seconds with its speed.

**Open:** whether it can join the hird; its human look.

## Huldra (`being.huldra`)

**Robin's mechanics (2026-10-05):** maybe a boss. You have to stun her somehow to reach her from behind.

**Suggestions (not decided):** a boss you can choose never to fight: met at dusk in the deep forest, she only watches and
calls until struck. She turns always to face you (fast), her gaze draws the hero toward her (a slow drift; sprinting breaks
it), and every ten seconds she calls two animals of the island. Her front takes nothing. The stun: a parry of an animal's
blow while she watches, a thrown stone, or a rune; stunned, she stops turning for two seconds and the hollow back takes full
damage; three such hits end it. Spared at low health she gives the forest's blessing (more game for a season); killed, her
tail (a trinket: the forest's animals ignore you).

**Open:** whether she can be killed or only driven off; whether her "husbands" are missing villagers to free and recruit.

## Tomte (`being.tomte`)

**Suggestions (not decided):** the comfort system's hidden hand. A homestead with a roofed house, a hearth, a bed and three
or more outdoor things (woodpile, haystack, skeps, drying rack) gets a tomte after the first night slept there. All buffs:
the woodpile gives a wood a day, the skeps honey, the Rested buff is longer, things dropped near home are tidied into a
crate. Keeping him: a bowl of porridge (a hearth dish) at the hearth once a season, and never wrecking the barn. Ignored he
does nothing worse than leave (reward, not punish). His page comes the first morning you find the bowl empty.

**Open:** whether he is ever drawn (a figure at the edge of the screen at night, gone when you look) or stays a legend.

## Näcken (`being.nacken`)

**Robin's mechanics:** his look and his place (above): a lush forest's stream or pool.

**Suggestions (not decided):** the first use of music in the world. At dusk the game's music fades and his instrument plays
from where he sits, louder as you near; while it plays the hero drifts toward the water (sprinting breaks it). Iron thrown
into the water silences him and earns his page (a "throw" action, useful against the huldra too). Do nothing and the pull
walks you into deep water. Whether iron really silences him is for the game to decide; the belief is the canon's.

**Open:** swimming (there is none); whether he can be killed or only silenced.

## Draugr (`being.draugr`)

**Robin's look (2026-10-12):** man-sized, a sword and a shield (whether he guards a mound, a wreck or walks out of the sea is
open).

**Suggestions (not decided):** the treasure-guardian. A mound is a place with a door; E opens it and he rises (the `brute`
mind with its chain of hits). The ring of stones is his bound: he cannot leave it. He swells as he is hurt (bigger, harder
blows), fire makes him flinch and recover slower, and when he is down a heavy blow within three seconds takes the head;
without it he rises again at the next full moon with his goods back (a repeatable fight for repeatable loot, not a
punishment). Drops: grave goods (a named weapon of the tier, silver, a ring); the mound can then be claimed.

**Open:** what claiming a mound gives; whether the hird fights him with you.

## Mara (`being.mara`)

**Suggestions (not decided):** the reason to build a proper house. Sleeping outside a closed room, or in one with a gap in
its walls, has a chance (rising with the day's kills) of the mara: you wake at midnight with a nightmare flash, no Rested,
health at half. A closed room with a door keeps her out for good; an iron knife left in the bed keeps her out of a gappy
house. The warning shows before you sleep, so it is a choice.

**Open:** whether it is too harsh in the first days (the reward-not-punish rule leans against it); the dream scene.

## Jötnar (`being.jotnar`)

**Suggestions (not decided):** the end-of-biome powers, one per far biome, the only things drawn bigger than a longhouse;
each is a place as much as a creature (a frost giant a weather front, a fire giant a volcano's mouth, a stone giant a hill
with a face), with two ways through: a long fight with the element as the weapon, or a bargain (a riddle contest). Beating
one is the mark of a legendary Viking.

**Open:** scale (how big the engine can draw and collide); whether giants are killed or only beaten.

## Valkyrie (`being.valkyrie`)

**Suggestions (not decided):** the face of death in the hird: when a hirdman dies in battle a valkyrie rides down, lifts him
and rides away (a short scene, the music gone to strings, a line in the hird's book). Never fought. On the hero's death
screen she is the tone: carried, not "game over". The page is earned by surviving a battle in which she came for someone
else.

**Open:** the hird's book (it does not exist); the death screen.

## Legends (`legend.midgardsormen` and the rest in the canon's `legends.md`)

Nothing of them is built or decided in the game.

---

## Ore and mining at night (Robin's side note, 2026-10-05)

**Robin:** ores can be found in caves and outside caves, but outside a cave or by day only by chance, at a low rate. At night
the stone that holds ore glows faintly. The mountain troll is the threat to mining.

**Built:** about a third of the rocks outside hold copper (none on the starter island): a sure 2 at night, one in six by day,
glowing copper at night; the first copper is the veins in the big island's open cliffs, the rest in the troll's cave (its
veins, ore rocks and his hoard). **Suggested and not built:** tin for bronze on another island; ore kinds by biome and
distance (`ore: 'copper' | 'tin' | 'iron'` at planting).
