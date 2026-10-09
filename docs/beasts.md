# The beasts: cards and rules

Robin's creatures (2026-10-05), from Norse myth and Scandinavian folklore (nordiska väsen), written as the cards the
Book of Beasts will show and the rules behind them. Robin gave the name and the lore; the mechanics marked
**(Robin)** are his; the strengths, weaknesses, warning signs, drops and everything marked **(suggestion)** are
Claude's and are not decided. The six animals of the first biome are in the game already (`BESTIARY` in
`templates/game.html`); these come as the islands and biomes they live in are built. Decided earlier: a page is
earned the first time you slay a creature, weaknesses should be real rules in the fight, and trolls and the other
väsen look like the classic old illustrations, hairy, heavy and long-armed, not cute.

Each card has the fields the book draws: name, folk name, where it is found, lore, strengths, weaknesses, the warning
sign, drops. Under it, **In the game** is the mechanics, and **Open** what still needs deciding.

---

## Mountain troll (Bergtroll)  (BUILT 2026-10-05: lives in a dark cave with glowing ore, hears mining, comes out some nights, fire-shy, stones at dawn if provoked; no torch or smelting yet; see CLAUDE.md)

**Found:** mountains and the hills above the tree line; caves anywhere. Only at night, or in the dark of a cave.

**Lore:** Trolls are old as the hills they live in and as slow to think. They hoard what the mountain holds, ore and
silver and the bones of travellers, and they cannot bear the sun: a troll caught in daylight turns to stone where it
stands. Many a strange rock on a hillside was once a troll that lingered too long.

**Strengths:** Enormous. One blow throws you across the slope. It commands the ore of its mountain: the stone round
it is hard, and it heals when it stands on bare rock. Does not fear fire or steel.

**Weaknesses:** Light. Dawn turns it to stone where it stands, and a strong light makes it flinch and shield its
eyes. Slow to turn; slower still to climb. Keep moving round it.

**Warning sign:** The ground shakes, and the ore in the rocks glows brighter as it comes.

**Drops:** Troll hide (heavy armour), a lump of the ore it guarded, and at dawn a troll stone (a runestone to read).

**In the game (Robin):** active only at night. At dawn it turns to stone, then cracks and crumbles away. It also
appears in caves at any hour, where it is dark; it is sensitive to light. Ore is the troll's domain: ores are found in
caves and outside them, but outside a cave by day they are rare and only found by chance, and at night the stone that
holds ore glows faintly. The troll is a threat to mining.

**In the game (suggestion):**
- The glow is the mining loop: at night ore veins show from a distance, so the best mining is at night, which is when
  the troll is out. A torch or brazier in a cave gives light that the troll will not enter (it stands at the edge of
  the light and growls), so lighting a cave is how you mine it safely, and light is a currency of safety: torches
  burn down.
- Its attack (through `ATTACKS` in `src/art.js`): a slow `arc` swipe with heavy knockback, plus a `slam` that cracks
  the ground and throws a ring of stones (shards you can mine for ore, so even its attacks feed the loop). It regens
  when standing on rock tiles, so the fight is to pull it onto grass.
- Dawn as a tool: a troll chased to the open at dawn stones in place. Its stone body is a mineable rock worth more
  than a normal vein, and a stoned troll can be read like a runestone once (the "troll stone" rune).
- Light sensitivity as a mechanic: a lit torch held up (F in fight mode when a torch is equipped?) makes it cover its
  eyes for a second: a stun window, the troll's parry.

**Open:** how much ore one troll guards; whether a troll follows you out of a cave into the night; whether a caved-in
troll leaves a loot pile or just the stone.

---

## Bysen

**Found:** deep forest, where the paths are few. Looks like a tree stump or a small grey old man, and you will not
know which until it moves.

**Lore:** The bysen was a man who moved a boundary stone, or felled a tree that was not his, and was cursed to walk
the forest forever. Now he does to others what was done to him: whoever he sets eyes on loses the way. He is not
cruel; he is lost, and lonely, and wants company.

**Strengths:** Cannot be fought, only escaped or appeased. Once he has seen you, the forest changes behind you.

**Weaknesses:** Turning your clothes inside out breaks his sight of you (the old remedy). He cannot cross running
water or a line of felled trees. He follows you only in the forest; the open meadow is safe.

**Warning sign:** A tree stump where there was none, and the chart no longer agrees with the ground.

**Drops:** Nothing. Leave him a gift (a piece of bread, a tool) and he gives something back: a lost thing of a
traveller from long ago.

**In the game (Robin):** confuses the player somehow; he must be made to lose the way home. Mechanics not decided.

**In the game (suggestion):** confusion as *the chart lying*, not the controls breaking (controls that fight you are
punishing; a map that fools you is a puzzle). While bysen has you:
- The chart's hero dot drifts: it shows you a little further from where you are each second, and the home marker
  slides slowly round the island. The dial by the chart shows the wrong time of day.
- The forest repeats: the ground painter draws a copy of the grove you just left ahead of you (a ring of tiles round
  the player is drawn from a cached chunk a few hundred units back), so walking "forward" looks like walking in a
  circle. Trees you felled stand again in the copy.
- The exit: the spell breaks when you leave the dark ground (code 3) for grass, cross a stream, or stand still for
  ten seconds and look (the hero turns his head, the copy fades). A felled tree line is a barrier he does not cross.
- The remedy from the book: "turn your clothes inside out", a C-cloth rune or a Tab panel action that flips the cloak
  and breaks the spell, learnt from Brokk or a stone.
- He is drawn as a stump with eyes that blink when you look away, then as the grey old man when the spell breaks.

**Open:** whether the drifting chart is too mean on a big island (a ten second cap on the drift?); whether he can
appear at all before the player has a chart.

---

## Shapeshifter (Hamnskiftare)

**Found:** anywhere, rarely. A deer that watches too long, a wolf that does not run from fire, a traveller on the
road at dusk.

**Lore:** Some are born with a second skin, and some win it by a bargain. In the old tales a man puts on a wolf's
belt and runs the forest for nine nights, or a woman wears a swan's feathers and flies. They are not evil; they are
people, with a secret, and most of them want to be left alone.

**Strengths:** You cannot tell it from the animal until it changes. In animal shape it has the animal's strengths;
in human shape it talks, trades and fights with a weapon.

**Weaknesses:** Its skin. Take the belt, the pelt or the feathers and it is only a person. Silver hurts it in animal
shape. It changes back at dawn whether it wants to or not.

**Warning sign:** An animal with a person's eyes; it looks at your face, not your hands.

**Drops:** Its skin (a wearable that lets *you* run as that animal for a minute: the first transformation item), or,
if you spare it, a friend who can scout as an animal.

**In the game (Robin):** a rare thing the player stumbles upon.

**In the game (suggestion):** one in forty animals placed on an island is a shapeshifter: it uses the animal's AI
and drawing until it takes damage or the hero stands next to it for a while, then (with the warning flash of the
animal's warning colour) it rises into a figure (`makeFigure`) over a second, with a weapon. The fight is a person
fight, the first in the game. Spare it (do not strike for five seconds while it stands with its hands up) and it
offers a trade or a tale; kill it and you get the skin. The skin on the character panel's amulet slot: hold the
amulet key and you become the animal for sixty seconds, with its speed (the deer: the fastest thing on the island).
That is a strong reward for a rare meeting, and the first spell-like thing in the game that is not a rune.

**Open:** whether the shapeshifter can be a hird member; how its human shape is drawn (a spec in `FOLK`).

---

## Huldra (Skogsrået)

**Found:** old forest, at the charcoal burners' camps and the loneliest groves. Dusk.

**Lore:** The lady of the forest. From the front she is the most beautiful woman you will see, in a grey dress with
a cow's tail she tucks away; from behind she is a hollow tree, bark and rot. She keeps the forest's animals as a
farmer keeps cattle, and a hunter who is kind to her finds game everywhere, while one who wrongs her finds the forest
turned against him. She takes husbands, and they do not come back.

**Strengths:** She does not fight you; the forest does. Wolves, boars and the bear come when she calls, and the
trees close ranks. Her face holds you: while she looks at you, you walk towards her.

**Weaknesses:** Her back. She turns to keep it from you; stun her (a shield bash, a thrown stone, a parry) and for
two seconds she does not turn, and a blow to the hollow back drops her. Be polite: a gift at her stump keeps the
hunting good and she never comes for you at all.

**Warning sign:** The animals go quiet and gather. Then music, and a woman at the edge of the trees.

**Drops:** Her tail (a trinket: the animals of the forest ignore you), and the forest's blessing: more game for a
season.

**In the game (Robin):** maybe a boss. You have to stun her somehow to reach her from behind.

**In the game (suggestion):** the first biome's boss, but a boss you can choose never to fight: she is met at dusk
in the deep forest, and until you strike her she only watches and calls. The fight: she stands still and turns to
face you always (`turn` fast), and her gaze pulls the hero towards her (a slow drift, not control loss; sprinting
breaks it). Every ten seconds she calls two animals from the island's stock (they wander in at speed). Her front is
immune. The stun: the bash rune, a parry of an animal's attack while she watches (she flinches), or a thrown stone
(a new throwable). While stunned she stops turning for two seconds, and the hollow back takes full damage; three
such hits end it. Killing her gives the tail; sparing her at low health (she asks, in a bubble) gives the blessing
and leaves the forest's keeper alive, which the reward-not-punish rule prefers.

**Open:** whether she should be killable at all, or only driven off; whether her "husbands" are the missing
villagers (a tie to the broken village and the hird: free them, recruit them).

---

## Tomtar (Tomte / Nisse)

**Found:** your own homestead, once it has a barn, a hearth and animals. Never seen, only noticed.

**Lore:** A small old man in a red cap, no taller than a child, who has lived on the farm longer than the farmer.
He works at night: the animals are fed, the woodpile is stacked, the tools are sharpened. He asks only for respect
and a bowl of porridge with butter at Yule. Forget the butter and the cow dies.

**Strengths:** Luck. A farm with a tomte prospers: crops grow, animals thrive, fires do not spread, thieves stumble.

**Weaknesses:** Pride. Mock him, spoil the barn, leave the porridge without butter, and he leaves, or worse, turns
his hand to mischief. Iron tools left on his seat offend him.

**Warning sign:** Small footprints in the frost by the barn; the cat watching an empty corner.

**Drops:** None. He is not a foe; his page is earned by keeping him.

**In the game (suggestion):** the comfort system's hidden hand. A homestead with a roofed house, a hearth, a bed and
three or more outdoor things (woodpile, haystack, skeps, drying rack) gets a tomte after the first night slept
there. Effects, all buffs: the woodpile gives one wood a day; the drying rack cures hide to leather; the skeps give
honey; the Rested buff is longer; dropped items near home are tidied into a crate. Keeping him: leave a bowl of
porridge (a hearth recipe) at the hearth once a season (the calendar), and never wreck the barn with him in it.
Ignored, he does nothing worse than leave (reward, not punish). His page comes from the first morning you find the
porridge bowl empty.

**Open:** whether he is ever drawn (a figure seen at the edge of the screen at night, gone when you look), or stays
a legend.

---

## Näcken

**Found:** waterfalls, mill races and the mouths of streams, at dusk and by moonlight. Never the sea.

**Lore:** A naked man, pale as the river stones, sitting in the current with a fiddle. His tune is the most
beautiful thing you will hear, and it draws you into the water, and the river keeps what it takes. He can take any
shape: a horse, a floating log, a boy. Some say he taught the best fiddlers their art, for a price.

**Strengths:** His music. Within earshot you walk towards the water, slowly and then faster. He cannot be reached
from the bank; he sits in the deep part.

**Weaknesses:** Iron in the water stops the fiddle: throw a knife or a nail in and he is silent and ashamed. Saying
his name aloud breaks the pull. He flees from the sound of church bells. Out of the water he is weak.

**Warning sign:** Fiddle music under the sound of the water, and the hero's feet moving on their own.

**Drops:** His bow (the fiddle's, a trinket that lets you play: a comfort buff for the hird), or a lesson: the
fiddle as a hird skill that raises morale on a long voyage.

**In the game (suggestion):** the first use of the music system in the world. Near a waterfall at dusk the game's
music fades and a solo fiddle (a new voice in `Music`) plays from his position, louder as you near. While it plays
the hero drifts towards the water (the pull, as with the huldra: a drift, sprint breaks it). Throw iron (drop a knife
or a nail into the water: a new "throw" action, also useful against the huldra) and the fiddle stops, he sinks, and
his page is earned. Do nothing and the pull walks you into deep water, where you cannot swim and take damage until
you climb out. He gives the game its first reason to look at waterfalls, and the fiddle a reason to take the hird out
in the boat.

**Open:** swimming (there is none; deep water is simply not walkable now); whether killing him is possible or he is
only silenced.

---

## Draugr

**Found:** burial mounds and ship graves, which stand on the islands as places (the idea bank's list). Day or night,
but only at the mound.

**Lore:** A dead chieftain who would not leave his treasure. He sits in the dark of his mound on his grave goods,
swollen and black, and he grows to the size of an ox when roused. He is as strong as ten men and smells of the sea
and of rot. The sagas say Grettir fought one and barely lived.

**Strengths:** Unnaturally strong, and tireless: he does not stagger and cannot be frightened. He swells when hurt:
the lower his health, the bigger and harder he hits. Grapples: if he catches you he squeezes.

**Weaknesses:** He cannot leave his mound: step outside the ring of stones and he stops at its edge. Fire burns him
and he fears it. Cut off his head (a finishing blow when he is down) or he rises again at the next full moon.

**Warning sign:** The mound's stones are cold even in the sun; the grass on it is dead; a smell of rot as you near.

**Drops:** Grave goods: the first real weapon of a tier (a bronze or iron sword with a name), silver, a ring, and his
page. The mound can then be claimed as a place.

**In the game (suggestion):** the treasure-guardian. A mound is a prop with a door; E opens it and he rises (a big
figure with a weapon, `brute` AI with the chain-of-hits). The ring of stones round the mound is his bound: a
`bounds` for the enemy. He swells with damage (size and `dmg` scale with lost health). Fire: a torch or brazier near
him makes him recover slower and flinch. When his health is gone he lies down; a heavy swing within three seconds
"takes the head" (the deed rune Clean cut grows from it); without it he rises again next full moon with his goods
back, which is a repeatable fight for repeatable loot, not a punishment. Each island with a mound has its own draugr
and its own named weapon; the legendary Vikings' tales can point to mounds.

**Open:** the mound as a claimed place (what claiming gives); whether the hird can fight him with you.

---

## Mara

**Found:** your bed, when you sleep uneasy: outdoors, in a house with a gap in the wall, or after a day with many
kills. Only at night.

**Lore:** She comes through the keyhole as a wisp and sits on the sleeper's chest until he cannot breathe. In the
morning the horse is lathered and the sleeper tired as if he never slept. In the old tale she is a woman cursed, or a
jealous one, and when the man plugs the keyhole she is trapped in the house with him and must take her true shape.

**Strengths:** She cannot be fought while you sleep. She takes your night: no Rested, less health at waking, and a
nightmare (a short dream scene).

**Weaknesses:** Steel under the pillow, a broom over the door, or a plugged keyhole: a closed house keeps her out.
Caught inside a closed house she is only a thin woman and flees from a lit hearth.

**Warning sign:** The hearth burns blue as you lie down; the bed creaks.

**Drops:** Her page, and the knowledge of how to keep her out. If trapped and spared, she tells where she came from
(a quest hook: the one who cursed her).

**In the game (suggestion):** the reason to build a proper house. Sleeping in a bed outside a closed room, or in a
room with a wall gap, has a chance (rising with the day's kills) of the mara: you wake at midnight instead of
morning with a nightmare flash (the screen dark, her shape over you, a choking breath sound), no Rested, and health
at half. A closed room with a door keeps her out for good, which is the mechanic: it makes the roof worth having
without punishing anyone who has not built one (sleeping rough still skips the night, as now; the mara is a
chance, not a certainty, and is shown by the warning before you sleep so you can choose). A steel item (an iron
knife) left in the bed's slot keeps her out of a gappy house too.

**Open:** whether a Mara chance in the first days is too harsh; the dream scene (a few seconds, no gameplay).

---

## Jötunn (Jätte)

**Found:** the far biomes: frost giants in the north where the snow does not melt, fire giants where the ground
burns, stone giants in the highest mountains. Not on the home island.

**Lore:** The giants were here before the gods, and the gods built the world from the body of one. They are of
frost, of fire and of stone, and they are the enemies of Asgard, but they are not all monsters: Mímir was wise, and
Skaði beautiful, and Þrymr only wanted a wife. All are stronger than any man, and taller than a hall.

**Strengths:** Size and power beyond anything on the islands. A frost giant's breath freezes the sea; a fire
giant's step burns the grass; a stone giant throws boulders that sink ships. They do not fear anything a human
carries.

**Weaknesses:** Each its element's opposite: fire for the frost giant, water for the fire giant, and for the stone
giant the slow patience of the hunter (it sleeps a hundred years, and a sleeping giant can be climbed). Wisdom:
some will bargain, riddle or trade instead of fight, and a wise giant beaten in a riddle gives more than one slain.

**Warning sign:** Weather. The cold deepens, the ground steams, the hills move.

**Drops:** A giant's tooth or hair (the stuff of legendary weapons), a treasure beyond any village's, and the fame
that makes you a legend (the reputation system).

**In the game (suggestion):** the end-of-biome powers, one per far biome, and the only things in the game drawn
bigger than a longhouse. Each is a place as much as a creature: a frost giant is a weather front that can be
found; a fire giant is a volcano's mouth; a stone giant is a hill with a face. Each has two ways through: the fight
(long, with the element as the weapon: the ship's fire, the river, the long wait) and the bargain (a riddle contest
drawn as a dialogue; the wise ones). Beating one is the mark of a legendary Viking, which is what the legendary
Vikings of the idea bank did before you, and how their names spread.

**Open:** everything about scale (how big can the engine draw and collide?); whether giants should ever be killable
or only beaten.

---

## Valkyrie (Valkyrja)

**Found:** battlefields after a great fight; the sky over a raid gone badly; the sea when a ship is lost. Never
sought, never fought.

**Lore:** Odin's maidens, armoured and mounted, who ride over the field choosing who dies and who is carried to
Valhalla to feast and fight until Ragnarök. To see one is to know a great warrior is about to die. They are not
cruel and not kind; they are the will of the gods.

**Strengths:** Cannot be fought, harmed or outrun. Where a valkyrie rides, the fight is already decided.

**Weaknesses:** None. But she keeps a bargain: a warrior who dies well is carried to Valhalla, and that is not
nothing.

**Warning sign:** Ravens gather; the light turns gold; a rider in the sky.

**Drops:** None. Her page is earned by surviving a battle in which she came for someone else.

**In the game (suggestion):** the death system's face, and the hird's. When a hirdman dies in battle (the hird can
die, decided) a valkyrie rides down over the field, lifts him, and rides away: a short scene, the music gone to
strings, and a line in the hird's book ("Taken to Valhalla at the raid on Kirkeby"). It makes a member's death an
event, not a number, and it is the one creature the player is never meant to fight. When the hero himself dies, a
valkyrie on the death screen is the tone: not "game over" but "carried", which fits the forgiving death at sea that
was decided. A player who has lost a hirdman to her earns the page. Later: a legendary hero she has chosen is a
boss you meet before she takes him.

**Open:** whether the hird's book exists yet (it does not); the death screen.

---

## Ore and mining at night (Robin's side note, with suggestions)

Robin: ores can be found in caves and outside caves, but outside a cave or by day only by chance, at a low rate. At
night the stone that holds ore glows faintly. The mountain troll is the threat to mining.

Suggestions:
- Ore is a property of some rock props (`ore: 'copper'|'tin'|'iron'`), set at planting from the biome and the
  distance from home. By day an ore rock looks like any other; the pick finds ore in it by chance (one in six). At
  night its veins glow, in the ore's colour, visible from a distance in the dark (the night layer already cuts out
  light round hearths; a vein is a small cold light), and mining it then gives the ore every time.
- Caves are places: a mouth in a cliff (a prop with a door), inside a small dark room drawn like indoors, with ore
  rocks and a troll. Light inside comes only from what you bring. This is the first use of the torch (roadmap step
  3's leftover): held in the off hand, it burns down, it lights a circle in the night layer, and the troll will not
  cross into it.
- Tool tiers follow: flint, then copper (from the first ore, needs the hearth: a smelting recipe), then bronze
  (copper and tin: two ores, two islands), then iron (bog iron in the marsh, the third biome). Brokk is the smith who
  makes the first metal tool ("bring me iron one day").
- The loop is reward, not punish: ore by day is a lucky find, ore at night is a sure one, and the troll is the price
  of the sure one. A lit cave, a stoned troll and a hird member holding the torch are all ways to make it safe.
