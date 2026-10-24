/* The runes, reworked (docs/runes-rework.md, Robin's decisions of 2026-10-23). A rune is a carved stone in your library at the
   altar; it does nothing until it is bound into a slot there with your blood. The slots are fixed: three actives, each an
   input (the guard-blow: the right button held and the left pressed; the dash: Space; the swing: the tool's blow), and four
   passives, one each of the body (hand, foot, eye, heart). An active charges on the blood you draw (so many landed blows) and
   is ready when its ring is full. A rune has three tiers: it grows by use, or at once by an animal's blood on the altar. Runes
   come from the sacrifice pool (the storm at the altar offers three, you take one) and from the world (met where they are met).
   Marks a foe can carry (struck, bleeding, afraid, chilled, burning) are how runes work together: one lays a mark, another
   reads it. This module is data and bookkeeping only, shared by the game, the editor and the tests; the powers themselves are
   in the engine and the page. The names and lines are LORE? until Alistair, LD's come. */
var Runes2 = (function () {
'use strict';
var SLOTS = [
  { id: 'guardBlow', name: 'Guard-blow', input: 'right held, left', active: true },
  { id: 'dash', name: 'Dash', input: 'Space', active: true },
  { id: 'swing', name: 'Swing', input: 'the tool', active: true },
  { id: 'shot', name: 'Shot', input: 'the bow', active: true },
  { id: 'hand', name: 'Hand', input: 'what you strike with' },
  { id: 'foot', name: 'Foot', input: 'how you move' },
  { id: 'eye', name: 'Eye', input: 'what you see and find' },
  { id: 'heart', name: 'Heart', input: 'what you endure' },
  { id: 'hearth', name: 'Hearth', input: 'home, the fire and the pot' },
  { id: 'helm', name: 'Helm', input: 'the sea and the far shore' },
  { id: 'pet', name: 'Pet', input: 'the beast at your side (a chapter to come)' }
];
// the kinds a rune belongs to (Robin, 2026-10-23: about fifty runes spread across kinds, combat first for different playstyles): what the browser sorts by
var KINDS = ['combat', 'movement', 'attack', 'bow', 'gathering', 'sailing', 'raiding', 'cooking', 'pet'];
var SLOT = {}; SLOTS.forEach(function (s) { SLOT[s.id] = s; });
// the numbers a rune works with, by tier (index 0 is tier I); num(state, id, key) reads the bound tier's
var LIST = [
  { id: 'bash', name: 'The Bash', slot: 'guardBlow', pool: 'start', source: 'the first shield', text: ['Breaks a block: the man before you with his guard up has it broken and is thrown; one with his guard down takes a low blow.', 'The man he is thrown into goes down with him.', 'A broken man stays open twice as long.'],
    n: { need: [3, 3, 2], throwK: [1, 1.2, 1.4], breakCd: [1.4, 1.4, 2.8] } },
  { id: 'charge', name: 'The Charge', slot: 'guardBlow', pool: 'world', source: 'the first boar', text: ['A rush three strides long: the first man in your way goes down, the next is pushed back. Needs no shield.', 'Two men go down before the rush, not one.', 'The rush strikes with the weapon in hand.'],
    n: { need: [3, 3, 3], len: [3, 3, 3.5], down: [1, 2, 2], strike: [0, 0, 1] }, lays: 'struck' },
  { id: 'dash', name: 'The Dash', slot: 'dash', pool: 'start', source: 'the first day', text: ['A short dash, untouchable for a breath.', 'The dash comes again sooner.', 'A dash in the last moment before a blow turns it: the perfect dodge opens him wider.'],
    n: { cd: [0.08, 0.04, 0.04], perfect: [1, 1, 1.5] } },
  { id: 'roll', name: 'The Roll', slot: 'dash', pool: 'storm', text: ['A roll: longer, longer untouchable, slower to rise.', 'A blow that lands on the roll is a miss.', 'You rise swinging: the first blow after a roll is heavy.'],
    n: { len: [1.7, 1.7, 1.9], invuln: [0.42, 0.6, 0.6], cd: [0.35, 0.3, 0.25] } },
  { id: 'thorsFell', name: 'Thor’s fell', slot: 'swing', pool: 'storm', text: ['One tree in four comes down with such force that it flies into two more and fells them.', 'One in three, and the trunk never flies at you.', 'One in two, and the logs come off the fallen trees by themselves.'],
    n: { chance: [0.25, 0.34, 0.5], fells: [2, 2, 2], safe: [0, 1, 1], logs: [0, 0, 1] } },
  { id: 'thorsWrath', name: 'Thor’s wrath', slot: 'hand', pool: 'storm', text: ['One blow in four calls lightning down on the man: he is struck for ten seconds, open to the hammer.', 'One blow in three.', 'The lightning hurts him too.'],
    n: { chance: [0.25, 0.34, 0.34], mark: [10, 10, 12], dmg: [0, 0, 0.6] }, lays: 'struck' },
  { id: 'bloodlust', name: 'Bloodlust', slot: 'hand', pool: 'world', source: 'the first wolf', text: ['Every man or beast you fell gives you a little of its strength: eight health.', 'Twelve health.', 'Twelve health, and your next active is ready at once.'],
    n: { heal: [8, 12, 12], ready: [0, 0, 1] } },
  { id: 'rushStep', name: 'The Rush-step', slot: 'foot', pool: 'storm', text: ['A dash through a struck man knocks him down.', 'A dash through any staggered man knocks him down.', 'Those he falls against stagger.'],
    n: { any: [0, 1, 1], spread: [0, 0, 1] }, reads: 'struck' },
  { id: 'catFoot', name: 'Cat foot', slot: 'foot', pool: 'world', source: 'the graves read', text: ['Your steps make no noise: a man at his post hears you only from close by.', 'Beasts notice you from closer.', 'In the dark nobody hears you at all.'],
    n: { hear: [0.5, 0.5, 0.5], beast: [1, 0.6, 0.6], night: [0, 0, 1] } },
  { id: 'stormsEye', name: 'The Storm’s eye', slot: 'eye', pool: 'storm', text: ['Lightning that strikes a man leaps to a second within reach.', 'To a third.', 'The leap hurts.'],
    n: { leaps: [1, 2, 2], dmg: [0, 0, 0.4] }, reads: 'struck', lays: 'struck' },
  { id: 'keenEye', name: 'Keen eye', slot: 'eye', pool: 'world', source: 'the first night', text: ['In the dark you see twice as far without a torch.', 'Beasts within earshot show on the chart.', 'A man who has not seen you is marked.'],
    n: { night: [2, 2, 2], chart: [0, 1, 1], marks: [0, 0, 1] } },
  { id: 'hammer', name: 'The Hammer', slot: 'heart', pool: 'storm', text: ['A club’s blow on a struck man does double and staggers him.', 'Any blow on a struck man does half again.', 'A struck man cannot raise his guard.'],
    n: { club: [2, 2, 2], any: [1, 1.5, 1.5], noGuard: [0, 0, 1] }, reads: 'struck' },
  { id: 'thickHide', name: 'Thick hide', slot: 'heart', pool: 'world', source: 'the first blow taken', text: ['The first blow of every fight does half.', 'The first two.', 'And a tenth of every blow turns aside.'],
    n: { first: [1, 2, 2], half: [0.5, 0.5, 0.5], armor: [0, 0, 0.1] } },
  /* ---- the set of 2026-10-23 (Robin: about fifty runes across kinds, combat and playstyles first; the names and words are placeholders, LORE?, Alistair, LD's to give; the numbers mine, first settings;
     status 'data' means the rune exists in the library and the storm's offer but its working is not yet built: the browser (runes.html) lists what each wants of Colin, AD and Derek, SD) ---- */
  // combat: the weapons' own ways (hand and heart passives)
  { id: 'axeBreaker', name: 'The Axe-breaker', kind: 'combat', slot: 'hand', pool: 'storm', status: 'built', text: ['An axe blow that breaks a guard staggers the man too.', 'The broken guard stays down twice as long.', 'A man whose guard you break takes the next blow double.'], n: { stag: [1, 1, 1], downK: [1, 2, 2], open: [1, 1, 2] }, wants: { sfx: ['guard_break'] } },
  { id: 'serpentTongue', name: 'The Serpent’s tongue', kind: 'combat', slot: 'hand', pool: 'storm', status: 'built', text: ['The seax crits one blow in four, and a crit bleeds: three health a second for five seconds.', 'One in three.', 'A bleeding man who runs falls.'], n: { crit: [0.25, 0.34, 0.34], bleed: [3, 3, 4], fall: [0, 0, 1] }, lays: 'bleeding' },
  { id: 'spearWall', name: 'The Spear-wall', kind: 'combat', slot: 'hand', pool: 'storm', status: 'built', text: ['A thrust that runs a man through hits the one behind him too.', 'A step back then a thrust is a pierce: no guard stops it.', 'The thrust reaches a stride further.'], n: { through: [1, 1, 1], pierce: [0, 1, 1], reach: [0, 0, 24] }, wants: { art: ['thrust_long: the spear thrust reaching a stride further'] } },
  { id: 'ringOfSteel', name: 'The Ring of steel', kind: 'combat', slot: 'heart', pool: 'storm', status: 'built', partial: 'the chain of five is the engine’s chainMax with a sword', text: ['With a sword the parry chain lasts six seconds, not four and a half.', 'The chain goes to five.', 'A chain of five is a finishing blow on any man.'], n: { chainT: [6, 6, 6], chainMax: [4, 5, 5], finish: [0, 0, 1] } },
  { id: 'berserk', name: 'Berserk', kind: 'combat', slot: 'heart', pool: 'storm', status: 'built', text: ['Under half health your blows do a third more, and you take a fifth more.', 'Under half health you do half again more.', 'And stamina costs nothing under a quarter.'], n: { at: [0.5, 0.5, 0.5], dmg: [1.33, 1.5, 1.5], taken: [1.2, 1.2, 1.2], freeAt: [0, 0, 0.25] }, wants: { sfx: ['berserk_roar'], art: ['the red eyes and the bared teeth on the kit face while berserk'] } },
  { id: 'oakArm', name: 'The Oak-arm', kind: 'combat', slot: 'hand', pool: 'storm', status: 'built', partial: 'III, the stun against a wall: a stagger instead', text: ['A club blow throws the man a step back.', 'Two steps, and he drops what he carries.', 'A thrown man who hits a wall is stunned.'], n: { kb: [60, 120, 120], drop: [0, 1, 1], wallStun: [0, 0, 1] } },
  { id: 'twinBlow', name: 'The Twin blow', kind: 'combat', slot: 'hand', pool: 'storm', status: 'built', text: ['The Dane axe recovers in half the time after a kill.', 'After any blow that lands.', 'The second blow of a chain cannot be parried either.'], n: { recK: [0.5, 0.5, 0.5], onAny: [0, 1, 1], noParry2: [0, 0, 1] } },
  { id: 'lastStand', name: 'The Last stand', kind: 'combat', slot: 'heart', pool: 'world', status: 'built', source: 'the first time you fall', text: ['A blow that would kill you leaves you with one health, once a fight.', 'And gives you a breath of untouchable time.', 'Twice a fight.'], n: { times: [1, 1, 2], invuln: [0, 0.8, 0.8] }, wants: { sfx: ['last_stand'] } },
  { id: 'ironSkin', name: 'Iron skin', kind: 'combat', slot: 'heart', pool: 'storm', status: 'built', text: ['A tenth of every blow turns aside.', 'A sixth.', 'A fifth, and arrows a third.'], n: { armor: [0.1, 0.16, 0.2], arrow: [0, 0, 0.33] } },
  { id: 'stoneGuard', name: 'The Stone guard', kind: 'combat', slot: 'heart', pool: 'storm', status: 'built', text: ['A block costs half the stamina.', 'A block costs nothing.', 'A heavy blow on your shield no longer breaks the guard.'], n: { stK: [0.5, 0, 0], noBreak: [0, 0, 1] } },
  { id: 'riposte', name: 'The Riposte', kind: 'combat', slot: 'guardBlow', pool: 'storm', status: 'built', text: ['The guard-blow in the moment after a parry is an instant strike that cannot be blocked.', 'It does half again.', 'And staggers.'], n: { need: [2, 2, 2], window: [0.6, 0.6, 0.8], dmg: [1, 1.5, 1.5], stag: [0, 0, 1] }, wants: { art: ['riposte: a short flicking blow from the guard, one-handed and with the shield'], sfx: ['riposte'] } },
  { id: 'warCry', name: 'The War-cry', kind: 'raiding', slot: 'guardBlow', pool: 'storm', status: 'built', text: ['A shout: every foe within hearing hesitates a second, every man of yours holds his line.', 'Two seconds, and the frightened run.', 'Your men’s next blows are heavy.'], n: { need: [4, 4, 3], hesitate: [1, 2, 2], run: [0, 1, 1], heavy: [0, 0, 1] }, wants: { art: ['war_cry: the hero throwing his head back, the weapon raised'], sfx: ['war_cry (the hero’s shout, three variations)'] } },
  // movement: the dash's other shapes, and the feet
  { id: 'blinkStep', name: 'The Blink-step', kind: 'movement', slot: 'dash', pool: 'storm', status: 'built', text: ['A step through the man before you: you stand behind him.', 'He is open for a breath when you come out.', 'The step goes through two.'], n: { cd: [0.5, 0.5, 0.4], open: [0, 0.6, 0.6], through: [1, 1, 2] }, wants: { art: ['blink: the hero fading out and in, a smear of him between'], sfx: ['blink_step'] } },
  { id: 'longLeap', name: 'The Long leap', kind: 'movement', slot: 'dash', pool: 'storm', status: 'built', text: ['A leap: over a fence, a stream, a fallen man.', 'Over a stake wall.', 'You land swinging: the first blow on landing is heavy.'], n: { len: [2.2, 2.6, 2.6], over: [1, 2, 2], heavy: [0, 0, 1] }, wants: { art: ['leap: a running jump, twelve frames, the cloak streaming'], sfx: ['leap_land'] } },
  { id: 'ghostStep', name: 'The Ghost-step', kind: 'movement', slot: 'dash', pool: 'storm', status: 'built', text: ['The dash leaves a shade where you stood; the men strike at it.', 'The shade lasts two seconds.', 'A man who strikes the shade is open.'], n: { shadeT: [1, 2, 2], open: [0, 0, 1] }, wants: { art: ['a ghost copy of the hero, blue-grey, fading'] } },
  { id: 'windFoot', name: 'The Wind-foot', kind: 'movement', slot: 'foot', pool: 'storm', status: 'built', text: ['You run a tenth faster.', 'A fifth, and the sprint costs a third less.', 'And you turn on the spot.'], n: { speed: [1.1, 1.2, 1.2], sprintK: [1, 0.67, 0.67], turn: [0, 0, 1] } },
  { id: 'sureFoot', name: 'The Sure-foot', kind: 'movement', slot: 'foot', pool: 'world', status: 'built', partial: 'nothing slows the walk today, so tier I has nothing to undo; II and III work', source: 'the first winter', text: ['Snow, sand and the shallows slow you no more.', 'The guard walk is as fast as a walk.', 'You cannot be knocked down.'], n: { noSlow: [1, 1, 1], guardWalk: [0, 1, 1], noDown: [0, 0, 1] } },
  { id: 'hunterStride', name: 'The Hunter’s stride', kind: 'movement', slot: 'foot', pool: 'world', status: 'built', partial: 'the notice distance is the beasts’ own 130, halved; the deer’s longer sight is not touched', source: 'the first deer', text: ['Walking toward a beast does not spook it until you are half as near.', 'Running does not either.', 'A beast you reach unseen is yours: the first blow kills.'], n: { nearK: [0.5, 0.5, 0.5], run: [0, 1, 1], kill: [0, 0, 1] } },
  // attack: the swing made into something else (the swing slot)
  { id: 'lunge', name: 'The Lunge', kind: 'attack', slot: 'swing', pool: 'storm', status: 'built', text: ['The swing is a lunge: a stride forward and a strike, a stride further than the reach.', 'Two strides.', 'A lunge that lands knocks the man back.'], n: { need: [0, 0, 0], stride: [1, 2, 2], kb: [0, 0, 80] }, wants: { art: ['lunge: a long step into a one-handed strike, with and without the shield'], sfx: ['lunge'] } },
  { id: 'whirl', name: 'The Whirl', kind: 'attack', slot: 'swing', pool: 'storm', status: 'built', text: ['With two hands the swing is a turn: every man round you is hit.', 'Twice round.', 'The whirl cannot be parried.'], n: { need: [2, 2, 2], turns: [1, 2, 2], noParry: [0, 0, 1] }, wants: { art: ['whirl: a full turn with the Dane axe or the spear, sixteen frames'], sfx: ['whirl'] } },
  { id: 'overhead', name: 'The Overhead', kind: 'attack', slot: 'swing', pool: 'storm', status: 'built', text: ['A held swing comes down from above: it breaks a guard and staggers.', 'It does double.', 'It knocks the man down.'], n: { need: [0, 0, 0], hold: [0.5, 0.5, 0.4], dmg: [1, 2, 2], down: [0, 0, 1] }, wants: { art: ['overhead: the weapon raised in both hands and brought down, with the axe, the sword and the club'], sfx: ['overhead'] } },
  { id: 'sweep', name: 'The Sweep', kind: 'attack', slot: 'swing', pool: 'storm', status: 'built', text: ['The spear sweeps low: every man in its arc staggers.', 'The sweep trips: they fall.', 'The sweep reaches further.'], n: { need: [0, 0, 0], arc: [2.4, 2.4, 2.8], trip: [0, 1, 1], reach: [0, 0, 16] }, wants: { art: ['sweep: a low wide spear swing, twelve frames'], sfx: ['sweep'] } },
  { id: 'feint', name: 'The Feint', kind: 'attack', slot: 'swing', pool: 'storm', status: 'built', text: ['The first swing after a pause is a feint: the man guards against nothing and is open.', 'The feint costs no stamina.', 'The blow after a feint is heavy.'], n: { need: [0, 0, 0], openT: [0.8, 0.8, 1], free: [0, 1, 1], heavy: [0, 0, 1] }, wants: { art: ['feint: a half swing checked and drawn back, eight frames'] } },
  // bow: the shot (active) and the archer's passives
  { id: 'twinShot', name: 'The Twin shot', kind: 'bow', slot: 'shot', pool: 'storm', status: 'built', text: ['A full draw looses two arrows at once.', 'Three, fanned.', 'Each does the whole.'], n: { need: [3, 3, 3], arrows: [2, 3, 3], each: [0.7, 0.6, 1] }, wants: { art: ['bow_shoot_twin: two arrows nocked'], sfx: ['twin_shot'] } },
  { id: 'pinningShot', name: 'The Pinning shot', kind: 'bow', slot: 'shot', pool: 'storm', status: 'built', text: ['A full draw pins the man where he stands for two seconds.', 'Three.', 'A pinned man cannot raise his guard.'], n: { need: [3, 3, 3], pinT: [2, 3, 3], noGuard: [0, 0, 1] }, wants: { sfx: ['pin_shot'] } },
  { id: 'fireArrow', name: 'The Fire-arrow', kind: 'bow', slot: 'shot', pool: 'storm', status: 'built', text: ['With a torch lit, a full draw looses a burning arrow: it lights thatch and burns a man for five seconds.', 'It needs no torch.', 'The fire spreads from the man to the next.'], n: { need: [4, 4, 4], burnT: [5, 5, 5], torch: [1, 0, 0], spread: [0, 0, 1] }, lays: 'burning', wants: { art: ['a burning arrow in flight and stuck'], sfx: ['fire_arrow'] } },
  { id: 'hawkEye', name: 'The Hawk’s eye', kind: 'bow', slot: 'eye', pool: 'storm', status: 'built', text: ['The bow aims a third further.', 'A hit on a man who has not seen you does double.', 'The arrow finds the eye: one hit in five is a finishing blow.'], n: { range: [1.33, 1.33, 1.33], unseen: [1, 2, 2], finish: [0, 0, 0.2] } },
  { id: 'bleedingPoint', name: 'The Bleeding point', kind: 'bow', slot: 'hand', pool: 'world', status: 'built', source: 'the first deer shot', text: ['A shot beast bleeds out in half the time.', 'A shot man bleeds too.', 'A bleeding beast leaves a trail you see from further.'], n: { bleedK: [0.5, 0.5, 0.5], men: [0, 1, 1], trail: [1, 1, 2] }, lays: 'bleeding' },
  { id: 'quickDraw', name: 'The Quick draw', kind: 'bow', slot: 'hand', pool: 'storm', status: 'built', text: ['The bow draws full in a second, not a second and a half.', 'In three quarters.', 'The snap shot does the full draw’s damage.'], n: { full: [1, 0.75, 0.75], snapK: [0.4, 0.4, 1] } },
  { id: 'stillHand', name: 'The Still hand', kind: 'bow', slot: 'heart', pool: 'storm', status: 'built', text: ['Standing still two seconds, your next arrow does half again.', 'Double.', 'And cannot be stopped by a shield.'], n: { stillT: [2, 2, 2], dmg: [1.5, 2, 2], noShield: [0, 0, 1] } },
  // gathering: the tool and the finder's eye
  { id: 'stoneBiter', name: 'The Stone-biter', kind: 'gathering', slot: 'swing', pool: 'storm', status: 'built', text: ['One pick blow in three cracks the rock whole.', 'One in two.', 'A cracked rock gives a piece of ore now and then.'], n: { need: [0, 0, 0], chance: [0.34, 0.5, 0.5], ore: [0, 0, 0.15] }, wants: { sfx: ['rock_split'] } },
  { id: 'greenThumb', name: 'The Green thumb', kind: 'gathering', slot: 'eye', pool: 'world', status: 'built', partial: 'III, herbs where you walked: no herb system yet', source: 'the first berries', text: ['A picked bush grows its berries again in half the time.', 'And gives half again more.', 'Herbs grow where you have walked.'], n: { regrowK: [0.5, 0.5, 0.5], yield: [1, 1.5, 1.5], herbs: [0, 0, 1] } },
  { id: 'keenNose', name: 'The Keen nose', kind: 'gathering', slot: 'eye', pool: 'storm', status: 'built', partial: 'III, the hidden things: not yet', text: ['Mushrooms and herbs within a stone’s throw show on the chart.', 'Ore too.', 'And what lies buried: the hidden cellar, the midden’s cache.'], n: { reach: [200, 260, 260], ore: [0, 1, 1], hidden: [0, 0, 1] } },
  { id: 'strongBack', name: 'The Strong back', kind: 'gathering', slot: 'heart', pool: 'world', status: 'built', source: 'the first chest carried', text: ['A heavy thing on your back slows you less.', 'Stacks hold thirty, not twenty-five.', 'A heavy thing slows you not at all.'], n: { carryK: [0.85, 0.85, 1], stack: [25, 30, 30] } },
  { id: 'quickHands', name: 'The Quick hands', kind: 'gathering', slot: 'hand', pool: 'storm', status: 'built', text: ['A tool swings a fifth faster.', 'Every log comes with a strip of fibre.', 'A tool’s blow bites a beast as a weapon’s.'], n: { pace: [1.2, 1.2, 1.2], fibre: [0, 1, 1], toolDmg: [0.8, 0.8, 1] } },
  { id: 'woodwright', name: 'The Woodwright', kind: 'gathering', slot: 'hand', pool: 'storm', status: 'built', text: ['A trunk gives a fifth log.', 'A felled tree drops its wood with no chopping of the trunk.', 'Building pieces cost a quarter less wood.'], n: { logs: [5, 5, 5], noTrunk: [0, 1, 1], costK: [1, 1, 0.75] } },
  // sailing and exploring: the helm
  { id: 'followingWind', name: 'The Following wind', kind: 'sailing', slot: 'helm', pool: 'storm', status: 'built', text: ['The sail gives half again more.', 'A wind abeam fills it as a wind behind.', 'No wind is against you.'], n: { sailK: [1.5, 1.5, 1.5], abeam: [0, 1, 1], never: [0, 0, 1] } },
  { id: 'longOar', name: 'The Long oar', kind: 'sailing', slot: 'helm', pool: 'storm', status: 'built', text: ['The oars pull a fifth faster.', 'The crew boards and lands in half the time.', 'Your ship turns on the spot.'], n: { oarK: [1.2, 1.2, 1.2], boardK: [1, 0.5, 0.5], turn: [0, 0, 1] } },
  { id: 'farSight', name: 'The Far sight', kind: 'sailing', slot: 'helm', pool: 'world', status: 'built', source: 'the lookout climbed', text: ['An island shows on the chart from twice as far.', 'A village on it, and its kind.', 'And whether it has been raided before.'], n: { chartK: [2, 2, 2], villages: [0, 1, 1], history: [0, 0, 1] } },
  { id: 'sealSkin', name: 'The Seal-skin', kind: 'sailing', slot: 'helm', pool: 'storm', status: 'built', text: ['You swim twice as far.', 'And at your walking pace.', 'The cold water does nothing to you.'], n: { swimK: [2, 2, 2], speed: [0.5, 1, 1], cold: [0, 0, 1] } },
  { id: 'starRoad', name: 'The Star-road', kind: 'sailing', slot: 'helm', pool: 'storm', status: 'built', partial: 'III, sailing on while you sleep: not yet; the mark is the right button on the map', text: ['At night your ship holds a course to the mark you set on the chart by itself.', 'By day too.', 'And sails on while you sleep aboard.'], n: { night: [1, 1, 1], day: [0, 1, 1], sleep: [0, 0, 1] } },
  { id: 'wreckersEye', name: 'The Wrecker’s eye', kind: 'sailing', slot: 'eye', pool: 'world', status: 'built', partial: 'III, the drowned chest: no such thing yet', source: 'the wreck pried', text: ['A wreck or a drift shows on the chart within reach.', 'A wreck gives twice the planks.', 'You see what lies under the shallows: the drowned chest.'], n: { reach: [300, 300, 400], planks: [1, 2, 2], under: [0, 0, 1] } },
  // raiding: the quiet way, the loud way and the carry
  { id: 'quietBlade', name: 'The Quiet blade', kind: 'raiding', slot: 'hand', pool: 'storm', status: 'built', partial: 'III, the sleeper: not yet (II already keeps the fellow asleep)', text: ['A blow from behind kills from a stride further, and no man cries out.', 'His fellow within reach does not wake.', 'A sleeper never wakes.'], n: { reach: [1, 1, 1], noCry: [1, 1, 1], fellow: [0, 1, 1], sleeper: [0, 0, 1] } },
  { id: 'lockBreaker', name: 'The Lock-breaker', kind: 'raiding', slot: 'hand', pool: 'storm', status: 'built', text: ['A door or a lock gives in half the blows.', 'And is heard half as far.', 'A chest opens to the knife, with no blow at all.'], n: { blowsK: [0.5, 0.5, 0.5], noiseK: [1, 0.5, 0.5], knife: [0, 0, 1] } },
  { id: 'ravenCall', name: 'The Raven’s call', kind: 'raiding', slot: 'eye', pool: 'storm', status: 'built', text: ['The men of a place within a stone’s throw show on the chart, walls or no walls.', 'And which way they look.', 'And the sleepers from the watch.'], n: { reach: [200, 260, 260], facing: [0, 1, 1], sleep: [0, 0, 1] } },
  { id: 'heavyBack', name: 'The Heavy back', kind: 'raiding', slot: 'heart', pool: 'storm', status: 'built', partial: 'II, the men carrying faster: not yet', text: ['You carry a chest at walking pace.', 'Your men carry faster too.', 'A carrier holds on however hurt.'], n: { carryK: [1, 1, 1], menK: [1, 1.3, 1.3], hold: [0, 0, 1] } },
  { id: 'torchHand', name: 'The Torch-hand', kind: 'raiding', slot: 'hand', pool: 'storm', status: 'built', partial: 'II, no harm from fire: fire does the hero no harm today anyway', text: ['Fire catches at a touch and spreads faster.', 'Fire does you no harm.', 'A burning man runs from you, not at you.'], n: { catch: [1, 1, 1], spreadK: [1.5, 1.5, 1.5], immune: [0, 1, 1], fear: [0, 0, 1] } },
  { id: 'shieldWall', name: 'The Shield-wall', kind: 'raiding', slot: 'heart', pool: 'world', status: 'built', source: 'the first line held', text: ['A man of yours beside you blocks as well as you.', 'Two.', 'A held line of yours cannot be broken.'], n: { men: [1, 2, 2], unbroken: [0, 0, 1] } },
  // cooking and home: the hearth
  { id: 'hearthsGift', name: 'The Hearth’s gift', kind: 'cooking', slot: 'hearth', pool: 'storm', status: 'built', text: ['A dish lasts half again longer.', 'Twice as long.', 'And heals a little every second while it lasts.'], n: { lastK: [1.5, 2, 2], heal: [0, 0, 0.1] } },
  { id: 'secondPortion', name: 'The Second portion', kind: 'cooking', slot: 'hearth', pool: 'storm', status: 'built', text: ['One cooking in three gives two.', 'One in two.', 'Every cooking.'], n: { chance: [0.34, 0.5, 1] } },
  { id: 'smokeAndSalt', name: 'Smoke and salt', kind: 'cooking', slot: 'hearth', pool: 'world', status: 'built', partial: 'II, two cuts of meat, and III, the feast: not yet', source: 'the first fish', text: ['Meat and fish cook in half the time.', 'Raw meat gives two cuts, not one.', 'A dish of fish and meat together is a feast: every buff at once.'], n: { cookK: [0.5, 0.5, 0.5], cuts: [1, 2, 2], feast: [0, 0, 1] } },
  { id: 'warmBelly', name: 'The Warm belly', kind: 'cooking', slot: 'hearth', pool: 'storm', status: 'built', text: ['A hot dish heals twice over the minute after.', 'The rested time at home lasts half again.', 'A fire of yours heals you from twice as far.'], n: { healK: [2, 2, 2], restK: [1, 1.5, 1.5], fireK: [1, 1, 2] } },
  // pets: a chapter to come (Robin, 2026-10-23: runes augment the pets); data only
  { id: 'packBond', name: 'The Pack-bond', kind: 'pet', slot: 'pet', pool: 'storm', status: 'data', partial: 'the pet chapter: no pet exists yet', text: ['Your beast fights half again as hard beside you.', 'And takes half as much.', 'A foe it bites is open to you.'], n: { dmg: [1.5, 1.5, 1.5], taken: [1, 0.5, 0.5], open: [0, 0, 1] } },
  { id: 'sharedBlood', name: 'The Shared blood', kind: 'pet', slot: 'pet', pool: 'storm', status: 'data', partial: 'the pet chapter: no pet exists yet', text: ['What heals you heals your beast.', 'What feeds you feeds it.', 'Its wounds close while you sleep.'], n: { heal: [1, 1, 1], food: [0, 1, 1], sleep: [0, 0, 1] } },
  { id: 'trackersNose', name: 'The Tracker’s nose', kind: 'pet', slot: 'pet', pool: 'storm', status: 'data', partial: 'the pet chapter: no pet exists yet', text: ['Your dog finds game: the nearest beast shows on the chart.', 'And what lies buried.', 'It brings what it finds.'], n: { game: [1, 1, 1], buried: [0, 1, 1], fetch: [0, 0, 1] } },
  { id: 'loyalHeart', name: 'The Loyal heart', kind: 'pet', slot: 'pet', pool: 'world', status: 'data', partial: 'the pet chapter: no pet exists yet', source: 'the pet’s first fight', text: ['A beast of yours that would die goes down instead, once a day.', 'It rises when the fight is over.', 'It rises at once, and bites.'], n: { times: [1, 1, 1], rise: [0, 1, 2] } },
  // the legendary pool: a jarl’s or a boss’s blood (none sacrificed yet; Robin, 2026-10-23)
  { id: 'fenrirsJaw', name: 'Fenrir’s jaw', kind: 'combat', slot: 'hand', pool: 'legend', status: 'built', partial: 'III makes a beast yours in name: no pet system yet', text: ['Every third blow that lands is a finishing blow.', 'Every second.', 'A finishing blow on a beast makes it yours.'], n: { every: [3, 2, 2], tame: [0, 0, 1] } },
  { id: 'allfathersEye', name: 'The All-father’s eye', kind: 'raiding', slot: 'eye', pool: 'legend', status: 'built', partial: 'II and III, what each carries and fears: not yet', text: ['You see every man and beast within sight, walls or no walls, by day and by night.', 'And what each carries.', 'And what each fears.'], n: { all: [1, 1, 1], carry: [0, 1, 1], fear: [0, 0, 1] } },
  { id: 'midgardsWall', name: 'Midgard’s wall', kind: 'combat', slot: 'heart', pool: 'legend', status: 'built', partial: 'III, arrows: the shield stops them from the front only', text: ['Your guard stops everything, from every side.', 'A blow it stops is given back to the man.', 'Arrows too.'], n: { all: [1, 1, 1], back: [0, 1, 1], arrows: [0, 0, 1] } }
];
var KIND_OF = { bash: 'combat', charge: 'combat', dash: 'movement', roll: 'movement', thorsFell: 'gathering', thorsWrath: 'combat', bloodlust: 'combat', rushStep: 'movement', catFoot: 'raiding', stormsEye: 'combat', keenEye: 'raiding', hammer: 'combat', thickHide: 'combat' };
var BY = {}; LIST.forEach(function (r) { if (!r.kind) r.kind = KIND_OF[r.id] || 'combat'; if (!r.status) r.status = 'built'; BY[r.id] = r; });
var TIERS = 3, GROW = [0, 50, 150], OPTS = { includeData: false };   /* includeData: the storm offers the runes not yet built too (the editors; never the game) */                 // uses at which a rune reaches tier II and III by itself
var RANKS = [null,                                 // the ranks of blood (Robin, 2026-10-23): how many stones rise from it and at what tier; the fifth rank draws on the legendary pool when it has runes
  { id: 1, name: 'thin blood', n: 1, tier: 1 },      // a hen, a hare, a fish, an adder: one stone, take it or leave it
  { id: 2, name: 'red blood', n: 2, tier: 1 },       // a deer, a boar, the farm's beasts: two
  { id: 3, name: 'a man\u2019s blood', n: 3, tier: 2 },   // a man: three, the dark road
  { id: 4, name: 'strong blood', n: 4, tier: 3 },    // a bear, a moose, a wolf, a troll: four
  { id: 5, name: 'a great one\u2019s blood', n: 5, tier: 3, legend: true }];   // a jarl, a boss: five, and the legendary runes among them (none yet)
var ANIMAL_RANK = { hen: 1, hare: 1, fish: 1, snake: 1, sheep: 2, goat: 2, deer: 2, boar: 2, cow: 2, man: 3, bear: 4, moose: 4, wolf: 4, troll: 4, jarl: 5, boss: 5 };
var ANIMAL_TIER = {}; for (var ak in ANIMAL_RANK) ANIMAL_TIER[ak] = RANKS[ANIMAL_RANK[ak]].tier;   // (kept for readers of the tier alone)
function rankOf(kind) { return RANKS[ANIMAL_RANK[kind] || 1]; }
var MARKS = { struck: { t: 10, col: '#ffe9a0' }, bleeding: { t: 20, col: '#c8322a' }, afraid: { t: 6, col: '#c9a8ff' }, chilled: { t: 8, col: '#a8d8ff' }, burning: { t: 6, col: '#ff9a40' } };
function fresh() { return { lib: {}, bound: {}, uses: {}, blood: {} }; }
function start(st) { st = st || fresh(); learn(st, 'bash', 1); learn(st, 'dash', 1); if (!st.bound.guardBlow) bind(st, 'guardBlow', 'bash'); if (!st.bound.dash) bind(st, 'dash', 'dash'); return st; }   // what every hero has from the first day
function known(st, id) { return !!(st && st.lib && st.lib[id]); }
function tierOf(st, id) { if (!known(st, id)) return 0; var t = st.lib[id], u = st.uses[id] || 0, g = 1; while (g < TIERS && u >= GROW[g]) g++; return Math.max(t, g); }   // the tier given, or the one use has reached
function learn(st, id, tier) { if (!BY[id]) return false; var t = Math.max(1, Math.min(TIERS, tier || 1)); if (!st.lib[id] || st.lib[id] < t) st.lib[id] = t; return true; }
function fits(st, slot) { return LIST.filter(function (r) { return r.slot === slot && known(st, r.id); }); }
function bound(st, slot) { return st && st.bound ? st.bound[slot] || null : null; }
function bind(st, slot, id) { if (!SLOT[slot] || !BY[id] || BY[id].slot !== slot || !known(st, id)) return false; st.bound[slot] = id; st.blood[slot] = 0; return true; }
function unbind(st, slot) { delete st.bound[slot]; st.blood[slot] = 0; }
function num(st, id, key) { var r = BY[id]; if (!r || !r.n || !r.n[key]) return 0; var t = Math.max(1, tierOf(st, id)); return r.n[key][Math.min(r.n[key].length, t) - 1]; }
function has(st, id) { for (var s in st.bound) if (st.bound[s] === id) return true; return false; }   // bound somewhere
function use(st, id, n) { if (!known(st, id)) return 0; var was = tierOf(st, id); st.uses[id] = (st.uses[id] || 0) + (n || 1); var now = tierOf(st, id); return now > was ? now : 0; }   // the new tier when use has raised it
function need(st, slot) { var id = bound(st, slot); return id ? (num(st, id, 'need') || 0) : 0; }
function charge(st, slot) { var id = bound(st, slot); if (!id) return 0; var nd = need(st, slot); return nd ? Math.min(1, (st.blood[slot] || 0) / nd) : 1; }   // 0 to 1: how full the blood ring is
function drawBlood(st, n) { for (var s in st.bound) if (SLOT[s] && SLOT[s].active && need(st, s)) st.blood[s] = Math.min(need(st, s), (st.blood[s] || 0) + (n || 1)); }   // a landed blow feeds every active
function ready(st, slot) { return !!bound(st, slot) && charge(st, slot) >= 1; }
function spend(st, slot) { st.blood[slot] = 0; }
function readyAll(st) { for (var s in st.bound) if (SLOT[s] && SLOT[s].active) st.blood[s] = need(st, s); }
// the storm's offer: so many stones as the blood's rank brings, from the sacrifice pool, at the rank's tier; a rune known already is offered one tier up, never twice; the fifth rank's stones come from the legendary pool first
function offer(st, rank, R) {
  R = R || Math.random; var rk = typeof rank === 'object' ? rank : RANKS[Math.max(1, Math.min(RANKS.length - 1, rank || 1))], n = rk.n, tier = Math.max(1, Math.min(TIERS, rk.tier));
  var pool = LIST.filter(function (r) { return (OPTS.includeData || r.status !== 'data') && (r.pool === 'storm' || (rk.legend && r.pool === 'legend')) && (!known(st, r.id) || (tierOf(st, r.id) < TIERS)); });   /* a rune known already is offered one tier up, whatever the blood's tier */
  var out = [], guard = 60; if (rk.legend) { var leg = pool.filter(function (r) { return r.pool === 'legend'; }); while (out.length < n && leg.length && guard-- > 0) { var li = Math.floor(R() * leg.length), lr = leg.splice(li, 1)[0]; pool.splice(pool.indexOf(lr), 1); out.push({ id: lr.id, tier: tier }); } }
  while (out.length < n && pool.length && guard-- > 0) { var i = Math.floor(R() * pool.length), r = pool.splice(i, 1)[0]; out.push({ id: r.id, tier: known(st, r.id) ? Math.min(TIERS, Math.max(tier, tierOf(st, r.id) + 1)) : tier }); }
  if (out.length < n) LIST.filter(function (r) { return (OPTS.includeData || r.status !== 'data') && r.pool === 'world' && !known(st, r.id); }).slice(0, n - out.length).forEach(function (r) { out.push({ id: r.id, tier: tier }); });   // the pool run dry: the world's runes come through the storm too
  return out;
}
function take(st, pick) { learn(st, pick.id, pick.tier); return pick.id; }
// a rune's glyph: strokes on a 10 by 14 grid, drawn in the stone's colour, filled red where it is woken (fill 0 to 1 from the foot)
var GLYPHS = {
  bash: [[[5, 0], [5, 14]], [[5, 3], [9, 7]], [[1, 7], [5, 3]]], charge: [[[2, 14], [2, 0], [8, 4], [2, 8]], [[2, 8], [8, 14]]], dash: [[[1, 14], [9, 0]], [[1, 7], [9, 7]]],
  roll: [[[3, 14], [3, 0], [8, 4], [3, 8]]], thorsFell: [[[5, 0], [5, 14]], [[1, 4], [9, 4]], [[2, 1], [5, 4], [8, 1]]], thorsWrath: [[[7, 0], [3, 5], [7, 7], [3, 14]], [[3, 5], [7, 5]]],
  bloodlust: [[[2, 14], [2, 0]], [[2, 3], [8, 0]], [[2, 8], [8, 5]]], rushStep: [[[1, 14], [9, 0]], [[9, 14], [1, 0]]], catFoot: [[[5, 0], [5, 14]], [[2, 11], [5, 14], [8, 11]]],
  stormsEye: [[[1, 0], [9, 14]], [[1, 7], [9, 7]], [[5, 0], [5, 14]]], keenEye: [[[1, 7], [5, 2], [9, 7], [5, 12], [1, 7]], [[5, 5], [5, 9]]], hammer: [[[5, 14], [5, 4]], [[1, 4], [9, 4], [9, 0], [1, 0], [1, 4]]],
  thickHide: [[[1, 14], [1, 2], [9, 5], [9, 14]], [[1, 8], [9, 8]]]
};
function glyph(c, id, x, y, s, col, w, fill) {
  var g = GLYPHS[id] || GLYPHS.bash, k = s / 14; c.save(); c.translate(x - 5 * k, y - 7 * k); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w || Math.max(0.8, s * 0.1);
  function strokeAll() { c.beginPath(); g.forEach(function (st) { st.forEach(function (p, i) { if (i) c.lineTo(p[0] * k, p[1] * k); else c.moveTo(p[0] * k, p[1] * k); }); }); c.stroke(); }
  c.strokeStyle = col || '#5a4a3a'; strokeAll();
  if (fill > 0) { c.save(); c.beginPath(); c.rect(-2 * k, 14 * k * (1 - fill) - 0.5, 14 * k, 14 * k * fill + 1); c.clip(); c.strokeStyle = '#b8352c'; c.lineWidth = (w || Math.max(0.8, s * 0.1)) * 1.15; strokeAll(); c.restore(); }
  c.restore();
}
// a standing stone, about a knee high, with the glyph on its face: state 'blank', 'carved', 'woken' (fill 1), 'broken'
function stone(c, x, y, h, id, state, fill) {
  var w = h * 0.7; c.save();
  if (state === 'broken') { c.fillStyle = '#6f6a62'; c.strokeStyle = '#2a241e'; c.lineWidth = Math.max(0.6, h * 0.05); [[-0.4, 0, 0.25, -0.25], [0.15, 0.05, 0.5, -0.2], [-0.1, -0.15, 0.2, -0.4]].forEach(function (f) { c.beginPath(); c.moveTo(x + f[0] * w, y + f[1] * h); c.lineTo(x + f[2] * w, y + f[1] * h); c.lineTo(x + (f[0] + f[2]) / 2 * w, y + f[3] * h); c.closePath(); c.fill(); c.stroke(); }); c.restore(); return; }
  c.fillStyle = '#7d786f'; c.strokeStyle = '#2a241e'; c.lineWidth = Math.max(0.7, h * 0.06); c.beginPath(); c.moveTo(x - w * 0.5, y); c.lineTo(x - w * 0.42, y - h * 0.85); c.quadraticCurveTo(x, y - h * 1.1, x + w * 0.4, y - h * 0.88); c.lineTo(x + w * 0.5, y); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(x - w * 0.42, y - h * 0.85); c.quadraticCurveTo(x, y - h * 1.1, x + w * 0.4, y - h * 0.88); c.lineTo(x + w * 0.3, y - h * 0.8); c.quadraticCurveTo(x, y - h * 1.0, x - w * 0.34, y - h * 0.78); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.moveTo(x + w * 0.5, y); c.lineTo(x + w * 0.4, y - h * 0.88); c.lineTo(x + w * 0.3, y - h * 0.84); c.lineTo(x + w * 0.4, y); c.closePath(); c.fill();
  if (state !== 'blank' && id) glyph(c, id, x, y - h * 0.5, h * 0.5, state === 'woken' || fill > 0 ? '#3a2a24' : '#3f3730', Math.max(0.7, h * 0.055), state === 'woken' ? 1 : (fill || 0));
  c.restore();
}
return { SLOTS: SLOTS, SLOT: SLOT, LIST: LIST, BY: BY, KINDS: KINDS, OPTS: OPTS, TIERS: TIERS, GROW: GROW, ANIMAL_TIER: ANIMAL_TIER, RANKS: RANKS, ANIMAL_RANK: ANIMAL_RANK, rankOf: rankOf, MARKS: MARKS, GLYPHS: GLYPHS, fresh: fresh, start: start, known: known, tierOf: tierOf, learn: learn, fits: fits, bound: bound, bind: bind, unbind: unbind, num: num, has: has, use: use, need: need, charge: charge, drawBlood: drawBlood, ready: ready, spend: spend, readyAll: readyAll, offer: offer, take: take, glyph: glyph, stone: stone };
})();
if (typeof module !== 'undefined') module.exports = Runes2;
