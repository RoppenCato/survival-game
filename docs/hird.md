# The hird: recruiting people and founding a town

A design concept for Robin to approve or change (written 2026-10-05, nothing of it is built). It answers two
questions from the plan: how do people join you, and what makes a place your town so that they can.

Everything here follows the rules already decided: reward, never punish; subtle guidance, nothing explained; real
Viking-age ways where they exist. Words: the band is the **hird**, a member a **hirdman**, they call each other
fellows. The settlement you found is your **steading** (a farm with its buildings) until it grows, then your **town**.

## 1. Founding a town: the claim stone

A town begins with a **claim stone**: a raised stone with your mark cut in it (a bautasten, which Vikings did raise
to claim and remember). It is a buildable piece, costs stone and a little copper (so it comes after the cave), and is
placed on open ground. Only one at a time, and only on land you can reach on foot from it.

What it does:
- Draws a **territory** round it on the chart: a ragged ring of about 25 tiles, grown by what you build (every roofed
  room and every yard piece inside it pushes the edge out a little). The ring is the thing the year's repopulation
  leaves alone, so claiming is what keeps a place yours when winter ends.
- Everything inside is **the steading**: its beds, stores, hearths and workplaces count for the hird (below).
- Gives the place a **name** when raised (a short Norse name from a list, or you type one; the chart shows it).
- Is the **muster point**: the hird gathers at the stone when you call them.

Comfort stays what it is (a room's roof, hearth, bench, bed, rug). The stone adds nothing to comfort. What the stone
asks before people will stay is **room and food**, below, and that is read from the whole territory, not one room.

Suggestion for the broken steading on the starter island: its old claim stone lies toppled by the well. Raising it
again (a few stone) claims the steading, which is the quiet way to teach the piece without a word. Brokk could be
the first to join when it stands, since he lives there already.

## 2. Who joins, and how

People join one at a time, each in a way that fits who they are. No menu to hire from. Every way ends the same:
the person walks to your claim stone and is a hirdman from then on.

- **Brokk** joins when his steading's stone is raised again (the first hirdman, a smith: he works the bench).
- **Freed thralls** after a raid: a raided hall or church holds captives; cut their rope and some follow you to
  your boat. They are weak but grateful (a trait).
- **A villager you have helped**: each hamlet has one person with a small trouble (wolves took sheep, a brother
  gone east, a well gone bad). Do the thing, and they ask to come. No quest log: they say it in their own voice,
  and you remember or not.
- **Kin by boat**: once your town has three roofs, a boat lands now and then with one or two people looking for a
  place (and news, and the names of legendary Vikings). You can turn them away.
- **Defeated raiders**: a raider who yields (health low, you stop) may ask to join rather than die. Risky: a
  trait like "sworn to Ragnar" that can turn on you later.
- **Later**: a trading hub where you pay a bride-price or a thrall-price for a person, which is historical and ugly
  in the right way; and legendary Vikings who come only when your name is big enough.

**What the town must have before anyone stays** (read from the territory round the stone):
- a **free bed** under a roof (one person, one bed);
- **food in store**: a chest or barrel in the territory with at least a few meals in it. People eat from the stores
  slowly (one meal a day each). When the store is empty they do not starve or leave; they are slow and sad, work at
  half pace and will not fight, and say so when you talk to them. That is the reward-not-punish shape of it.
- room at the **fire**: a hearth with a roof for every four people (a hall).

The stone shows how many it can hold: "Room for 2" over it when you look, counted from beds, food and fires.

## 3. What they do at home

Each hirdman has **stats** (health, strength, aim, wits, strength at the oar) rolled from a small range, and one or
two **traits** (hardy, keen eyed, slow, greedy, loyal, afraid of the dark, sworn to someone). Training changes stats
over time; traits are for life.

At home they have a **job**, given by placing them: talk to a person and choose, or lead them to a workplace and
say "work here" (E at the person, then E at the thing). Jobs come from the pieces you already have:

| Workplace | Job | What happens |
| --- | --- | --- |
| woodpile | woodcutter | the pile fills with a few wood an hour from the nearest grove; the trees regrow |
| workbench | crafter | makes arrows, torches, rope slowly from the stores |
| hearth | cook | turns meat and berries in the stores into meals |
| drying rack | tanner | (if curing comes back) |
| shipwright's bench | shipwright | finishes a yard you have laid out, slowly, while you are away |
| the fields (later) | farmer | barley, which is food that keeps |
| none | idle | wanders the steading, sits by the fire, sleeps at night |

Nobody is useless while idle: an idle person **defends** the steading when something attacks (wolves, a raid) with
whatever weapon is in the shield rack, and **carries** drops that lie about inside the territory into the nearest
chest. Idle people have a day: the well in the morning, the fire at dusk, their bed at night, and they talk to
each other (two lines of chatter when they meet). That is the life of the place and most of the charm.

**Sleeping and healing:** a hirdman hurt in a fight heals in bed over a day. One who dies is dead; a small cairn by
the stone with their name, and the people mention them for a while.

## 4. Taking them along

At the claim stone you **muster**: pick who comes (the rest stay and keep working). Those who come:
- **crew the boat**: every rower adds speed, the sail needs two hands, a steersman holds the course so you can
  fight from the deck;
- **fight beside you** on land: follow at a few steps, strike what you strike, hold a line when you stand still
  with the shield up, and run when you run. No orders beyond that, so the keyboard-first rule holds.
- share the **loot**: raid loot goes to the boat, and the stores, not to your bag.

Rowing and sailing times are tuned in the Sea Editor, which already shows them.

## 5. Robin's answers (2026-10-06)

1. Stone only, and berries for the red of the runes (so the stone is a coloured runestone).
2. Several stones: the idea is to expand and take places over, but not every island conquered. It must be a decision,
   so the number of stones is limited: every stone after the first needs a hirdman who stays as its keeper.
3. Yes: they stay without food, and go slow and sad.
4. Yes, something like that; never lost at random. Illness and the like can come later.
5. Brokk is the first hirdman.
6. Muster at the stone, or a speaking place; later from the Jarl's seat in the main hall, so it must be movable.
7. The hird is only used at the base and on raids, never in the open world (too hard to balance). They follow you
   round the base when you talk to them, and you assign them by leading them to a workplace.

Step 1 of the build order is built (the stone, the reach, room and food, Brokk joining, follow, jobs, muster) and the
numbers live in `src/hird.js`, tuned in the Hird Editor.

## 6. The questions as they were asked

- Should the claim stone cost copper (so a town comes after the cave), or only stone (so it comes with the first
  house)? My suggestion: stone only, and the copper goes to the muster horn later.
- One town or several? My suggestion: several stones, one territory each, and the first one is "home" for the
  raft drifting back after death.
- Do people need food to stay, or only to work and fight? My suggestion as above: they stay regardless, and go
  slow without food, which is the Valheim-food shape you chose.
- Can hirdmen die? My suggestion: yes, and rarely. A death should mean something; a healing bed makes it rare.
- Should Brokk be the first hirdman, or stay a friend who teaches? My suggestion: the first hirdman, and he keeps
  his lines.
- The muster: at the stone only, or anywhere by calling? My suggestion: the stone, so the stone matters.

## 7. The order to build it in

1. The claim stone piece, the territory on the chart, "Room for N".
2. Brokk joins when the old stone is raised; he walks to the bench and works there (the first job).
3. Food from the stores, beds, the idle day (well, fire, bed), chatter between two people.
4. The woodcutter and the cook, the first two jobs that give something.
5. Muster at the stone, following on land, fighting beside you.
6. Crewing the raft, then the first real boat.
7. The ways of joining beyond Brokk: the helped villager first, kin by boat second, freed thralls with the first raid.
