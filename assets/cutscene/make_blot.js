// make_blot.js: writes scenes/blot.json, the village's blot staged as a rite (Colin, AD, 2026-10-29; Robin: "some ritual to it, and not
// just people standing around in a circle"). The beats are docs/blot-ritual.md's, from Snorri's account (Hakon the Good, ch. 16):
// gather, hallow, the beasts led, the ring, the offering, the reddening, the kettle, the blessing and the fulls, the memory, then the
// gods' answer and the teaching. Clips not made yet stand in: 'kneel' for bowing, 'interact' for raising the horn and for sprinkling,
// 'carry_walk' for bringing the ale; the new clips (docs/blot-ritual.md, "The art it needs") replace them by name.
//   node work/cutscene/scenes/make_blot.js
const fs = require('fs'), path = require('path');
const N = 10, R = 80;
// the folk's places: two arcs, west and east of the vé, the south left open for the hero and the view, the north for the goði and the tree
const spot = i => { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), a = (side > 0 ? 0 : 180) + side * (-50 + k * 26); return [Math.round(Math.cos(a * Math.PI / 180) * R), Math.round(Math.sin(a * Math.PI / 180) * R * 0.75)]; };
const from = i => [i % 2 ? 260 + (i % 3) * 18 : -260 - (i % 3) * 18, 120 + Math.floor(i / 2) * 22];   // where each comes from: the houses east and west
const folk = i => 'folk:' + i;
const S = [];
// 0. the stage, unseen
S.push({ do: 'fade', to: 1, s: 0.6, note: 'set the stage unseen' });
S.push({ do: 'place', who: 'lead', at: [0, -46], face: 's' });
S.push({ do: 'place', who: 'hero', at: [0, 120], face: 'n' });
S.push({ do: 'place', who: 'beastman', at: [-150, 70], face: 'e' });
for (let i = 0; i < N; i++) S.push({ do: 'place', who: folk(i), at: from(i), face: i % 2 ? 'w' : 'e' });
S.push({ do: 'camera', at: [0, 30], zoom: 1.05, s: 0.01 });
S.push({ do: 'fx', name: 'dark', to: 0.4, s: 0.01, note: 'dusk' });
S.push({ do: 'par', steps: [{ do: 'fade', to: 0, s: 1.6 }, { do: 'bars', to: 1, s: 1.2 }] });
S.push({ do: 'card', title: 'THE BLÓT', sub: 'midsummer, at dusk' });
// 1. the gathering: they come in a file from the houses, each carrying something, and take their places
S.push({ do: 'par', note: 'the gathering', steps: Array.from({ length: N }, (_, i) => ({ do: 'par', steps: [{ do: 'play', who: folk(i), clip: 'carry_walk', s: 0.1, hold: true }, { do: 'walk', who: folk(i), to: [[from(i)[0] * 0.45, from(i)[1] * 0.6], spot(i)], speed: 34 + (i % 3) * 4, face: [0, 0] }] })) });
S.push({ do: 'par', steps: Array.from({ length: N }, (_, i) => ({ do: 'play', who: folk(i), clip: 'pickup', s: 0.6 })).concat([{ do: 'say', who: 'lead', text: 'Set down what you have brought. The fire is lit, and the gods are near.' }]) });
// 2. the hallowing: the goði carries fire sunwise round the vé, the people turning after the flame
const ring = [[60, -40], [100, 10], [60, 70], [0, 92], [-60, 70], [-100, 10], [-60, -40], [0, -46]];
S.push({ do: 'camera', at: [0, 16], zoom: 1.2, s: 1.5 });
S.push({ do: 'say', who: 'lead', text: 'With fire I go round this ground. Let what is done here be holy.', s: 3 });
S.push({ do: 'walk', who: 'lead', to: ring, speed: 30, face: 's', note: 'the torch carried sunwise (walk_torch when it is made)' });
// 3. the beasts led in: the hero brings the wolf; the farm's beast is led to the stone
S.push({ do: 'par', steps: [{ do: 'walk', who: 'hero', to: [0, 44], speed: 30, face: 'n' }, { do: 'walk', who: 'beastman', to: [[-80, 40], [-30, 10]], speed: 26, face: 'e' }] });
S.push({ do: 'call', fn: 'blotLayWolf', note: 'the game: the wolf laid on the stone; the farm beast (if Robin wants it) led beside it' });
// 4. the ring
S.push({ do: 'play', who: 'lead', clip: 'interact', s: 1.4, note: 'the oath ring lifted from the altar and held up (raise_cup with the ring in hand)' });
S.push({ do: 'say', who: 'lead', text: 'On this ring our oaths are sworn. Let it be reddened.' });
// 5. the offering: the goði's blow, the blood caught
S.push({ do: 'call', fn: 'blotOffer', note: 'the game: the goði\'s blow (sacrifice clip), the beast falls, the blood' });
S.push({ do: 'play', who: 'beastman', clip: 'kneel', s: 2, note: 'the blood caught in the hlaut-bowl' });
// 6. the reddening: the altar, the posts, then down the line of people, each bowing as he passes; the hero last
S.push({ do: 'play', who: 'lead', clip: 'interact', s: 1.2, note: 'the altar sprinkled (sprinkle)' });
const order = [0, 2, 4, 6, 8, 9, 7, 5, 3, 1];
order.forEach((i, k) => { const p = spot(i); S.push({ do: 'walk', who: 'lead', to: [Math.round(p[0] * 0.7), Math.round(p[1] * 0.7)], speed: 46, face: [p[0], p[1]] }); S.push({ do: 'par', steps: [{ do: 'play', who: 'lead', clip: 'interact', s: 0.55 }, { do: 'play', who: folk(i), clip: 'kneel', s: 1.4, wait: false }] }); });
S.push({ do: 'walk', who: 'lead', to: [0, 22], speed: 40, face: 'hero' });
S.push({ do: 'par', steps: [{ do: 'play', who: 'lead', clip: 'interact', s: 0.8 }, { do: 'play', who: 'hero', clip: 'pickup', s: 1.2 }] });
S.push({ do: 'say', who: 'lead', text: 'You too, stranger. You are of this place tonight.' });
// 7. the kettle: the meat goes in, the people sit
S.push({ do: 'call', fn: 'blotKettle', wait: false, note: 'the game: the meat in the great kettle, the steam' });
S.push({ do: 'par', steps: Array.from({ length: N }, (_, i) => ({ do: 'play', who: folk(i), clip: 'sit', s: 0.1, hold: true })) });
S.push({ do: 'walk', who: 'lead', to: [0, -30], speed: 34, face: 's' });
// 8. the blessing and the fulls
S.push({ do: 'camera', at: [0, 4], zoom: 1.3, s: 1.6 });
S.push({ do: 'play', who: 'lead', clip: 'interact', s: 1.6, note: 'the horn held over the fire and hallowed (raise_cup)' });
S.push({ do: 'say', who: 'lead', text: "Odin's cup. For victory.", s: 2.4 });
S.push({ do: 'par', steps: Array.from({ length: N }, (_, i) => ({ do: 'play', who: folk(i), clip: 'interact', s: 1.2 })) });
S.push({ do: 'say', who: 'lead', text: "Njord's cup, and Frey's. For a good year, and peace.", s: 3 });
S.push({ do: 'par', steps: Array.from({ length: N }, (_, i) => ({ do: 'play', who: folk(i), clip: 'interact', s: 1.2 })).concat([{ do: 'play', who: 'hero', clip: 'drink', s: 1.4 }]) });
S.push({ do: 'say', who: 'lead', text: 'And the last cup for those who are not here.', s: 3 });
S.push({ do: 'play', who: 'lead', clip: 'kneel', s: 2.2, note: 'the horn poured on the ground (pour); silence' });
S.push({ do: 'wait', s: 1.2 });
// 9. the answer: as the hero drinks, the gods answer
S.push({ do: 'par', steps: [{ do: 'fx', name: 'dark', to: 1, s: 2.2 }, { do: 'camera', at: [0, 10], zoom: 1.5, s: 2.2 }, { do: 'play', who: 'hero', clip: 'drink', s: 2 }] });
S.push({ do: 'fx', name: 'thunder' });
S.push({ do: 'wait', s: 0.7 });
S.push({ do: 'par', steps: [{ do: 'fx', name: 'flash' }, { do: 'fx', name: 'bolt', at: [0, 0] }, { do: 'fx', name: 'stones', at: [0, -20] }].concat(Array.from({ length: N }, (_, i) => ({ do: 'play', who: folk(i), clip: 'kneel', s: 2.4, wait: false }))) });
S.push({ do: 'wait', s: 1.4 });
S.push({ do: 'fx', name: 'glow', on: true, note: 'the motes flow to the hero' });
S.push({ do: 'talk', who: 'lead', lore: 'blot.teach', lines: ['The gods have answered. Something of theirs has come into you.', 'Choose. One mark of the old ones, yours to carry.'] });
S.push({ do: 'call', fn: 'firstRunePick', note: 'the game: the scripted first pick on the rune screen; waits until it is made' });
S.push({ do: 'fx', name: 'glow', on: false });
// 10. the feast and the teaching
S.push({ do: 'par', steps: [{ do: 'fx', name: 'dark', to: 0.4, s: 2 }, { do: 'camera', at: [0, 40], zoom: 1.1, s: 2 }] });
S.push({ do: 'talk', who: 'lead', lore: 'blot.after', lines: ['Raise your own stone where you live, and bring the autumn\'s offering there.', 'Come to me after the feast, and I will show you how it is made.'] });
S.push({ do: 'par', steps: [{ do: 'camera', release: true, s: 1.6 }, { do: 'bars', to: 0, s: 1.4 }] });
const scene = {
  id: 'blot', title: "The village's blót (the first rite)", anchor: 'altar', skip: true,
  cast: { lead: { role: 'role.elder', name: 'the goði' }, beastman: { role: 'role.villager', name: 'a farmer' }, folk: { role: 'role.villager' } },
  steps: S,
  end: [
    { do: 'place', who: 'hero', at: [0, 52], face: 'n' },
    { do: 'flag', key: 'blotDone', value: true },
    { do: 'call', fn: 'blotAfter', note: 'the game: the altar taught, the quest step, the stones left risen, the feast going on (the folk seated by the kettle)' },
    { do: 'fx', name: 'dark', to: 0 },
    { do: 'music', name: null }
  ]
};
fs.writeFileSync(path.join(__dirname, 'blot.json'), JSON.stringify(scene, null, 1));
const CS = require('../src/cutscene.js'); console.log('blot.json:', S.length, 'steps, about', CS.length(scene).toFixed(0), 's;', CS.check(scene).join('; ') || 'well formed');
