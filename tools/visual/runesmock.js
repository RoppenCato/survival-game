// A mock of the reworked rune system's screens (docs/runes-rework.md), for Robin's eye (2026-10-23): the Runes tab with its
// slots, the choices for one slot, the chosen rune's card; the toolbar's blood marks; the blót's offer of three.
//   node tools/visual/runesmock.js   -> docs/pictures/runes-mock.png
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas'), fs = require('fs'), path = require('path');
const FD = path.join(__dirname, '..', '..', 'assets', 'fonts');
try { fs.readdirSync(FD).filter(f => /\.ttf$/i.test(f)).forEach(f => GlobalFonts.registerFromPath(path.join(FD, f), 'Alegreya')); } catch (e) {}
const W = 1200, H = 1560, cv = createCanvas(W, H), c = cv.getContext('2d');
const OAK = '#2b2016', OAK2 = '#3a2b1c', GILT = '#c9a553', CREAM = '#efe3c6', PALE = '#ead08a', DIM = 'rgba(239,227,198,0.45)', RED = '#b8352c', GREEN = '#9be58b';
function board(x, y, w, h, title) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + 6, y + 8, w, h); c.fillStyle = OAK; c.fillRect(x, y, w, h); c.strokeStyle = '#120c08'; c.lineWidth = 3; c.strokeRect(x, y, w, h); c.strokeStyle = GILT; c.lineWidth = 1.5; c.strokeRect(x + 7, y + 7, w - 14, h - 14); c.strokeRect(x + 11, y + 11, w - 22, h - 22);
  if (title) { const tw = c.measureText(title).width + 60; c.fillStyle = '#4a3622'; c.fillRect(x + w / 2 - tw / 2, y - 14, tw, 30); c.strokeStyle = GILT; c.strokeRect(x + w / 2 - tw / 2, y - 14, tw, 30); c.fillStyle = PALE; c.font = 'bold 18px Alegreya'; c.textAlign = 'center'; c.fillText(title, x + w / 2, y + 7); c.textAlign = 'left'; } }
function well(x, y, w, h) { c.fillStyle = '#17110c'; c.fillRect(x, y, w, h); c.strokeStyle = '#0b0806'; c.lineWidth = 1; c.strokeRect(x, y, w, h); }
function vellum(x, y, w, h) { c.fillStyle = '#e8dcbb'; c.fillRect(x, y, w, h); c.strokeStyle = '#8a7650'; c.lineWidth = 1.5; c.strokeRect(x, y, w, h); c.strokeStyle = 'rgba(138,118,80,0.35)'; c.strokeRect(x + 5, y + 5, w - 10, h - 10); }
function text(s, x, y, size, col, bold, align) { c.font = (bold ? 'bold ' : '') + size + 'px Alegreya'; c.fillStyle = col; c.textAlign = align || 'left'; c.fillText(s, x, y); c.textAlign = 'left'; }
function runeGlyph(x, y, r, col, k) { c.strokeStyle = col; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); const shapes = [[[0, -1, 0, 1], [0, -1, 0.7, -0.4], [0, -0.3, 0.7, 0.3]], [[0, -1, 0, 1], [-0.7, 0.2, 0, -0.5], [0.7, 0.2, 0, -0.5]], [[-0.6, -1, -0.6, 1], [-0.6, -1, 0.6, 0.2], [0.6, 1, -0.6, -0.2]], [[0, -1, 0, 1], [-0.7, -0.4, 0.7, 0.4]], [[-0.5, 1, 0, -1], [0, -1, 0.5, 1], [-0.3, 0.2, 0.3, 0.2]], [[0, -1, 0, 1], [-0.6, -0.2, 0.6, -0.8]]][k % 6]; shapes.forEach(s => { c.moveTo(x + s[0] * r, y + s[1] * r); c.lineTo(x + s[2] * r, y + s[3] * r); }); c.stroke(); }
function tier(x, y, n, of) { for (let i = 0; i < of; i++) { c.fillStyle = i < n ? GILT : 'rgba(201,165,83,0.25)'; c.beginPath(); c.arc(x + i * 12, y, 4, 0, 7); c.fill(); } }
function bloodMark(x, y, r, k) { c.strokeStyle = 'rgba(184,53,44,0.45)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); if (k > 0) { c.strokeStyle = RED; c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + k * 6.283); c.stroke(); } }

// ---------- the game behind: a plain meadow tint ----------
c.fillStyle = '#6b7c3f'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(10,8,6,0.55)'; c.fillRect(0, 0, W, 750); c.fillStyle = 'rgba(10,8,6,0.55)'; c.fillRect(0, 810, W, 750);

// ================= Screen 1: the Runes tab at a fire =================
text('1. The Runes tab (Tab at your fire)', 30, 36, 22, CREAM, true);
board(40, 70, 300, 640, 'Runes');
// the hero's slots
const slots = [['Guard-blow', 'right held, left', 'the Charge', 1, true], ['Dash', 'Space', 'the Dash', 2, true], ['Draw', 'the bow', 'chapter 2', 3, false], ['Swing', 'the tool', 'Thor’s fell', 4, true], ['Call', 'G held', 'chapter 3', 5, false]];
let yy = 110; slots.forEach((s, i) => { const chosen = i === 0; well(60, yy, 260, 62); if (chosen) { c.strokeStyle = PALE; c.lineWidth = 2; c.strokeRect(60, yy, 260, 62); } c.fillStyle = s[4] ? '#4a3622' : '#2a2018'; c.fillRect(68, yy + 8, 46, 46); c.strokeStyle = s[4] ? GILT : '#3a2b1c'; c.lineWidth = 1.5; c.strokeRect(68, yy + 8, 46, 46); if (s[4]) runeGlyph(91, yy + 31, 15, PALE, s[3]); text(s[0], 124, yy + 26, 17, s[4] ? CREAM : DIM, true); text(s[1], 124, yy + 44, 12, DIM); text(s[2], 312, yy + 36, 13, s[4] ? (chosen ? PALE : CREAM) : DIM, false, 'right'); yy += 70; });
// the band
text('The band', 60, yy + 22, 15, CREAM, true); text('passives, 2 of 6 places open', 150, yy + 22, 12, DIM); yy += 32; well(60, yy, 260, 72);
[['Long wind', 0, true], ['Thick hide', 1, true], [null, 2, false], [null, 3, false], [null, 4, false], [null, 5, false]].forEach((b, i) => { const bx = 70 + i * 42, by = yy + 10; c.fillStyle = b[2] ? '#4a3622' : '#231a12'; c.fillRect(bx, by, 36, 36); c.strokeStyle = b[2] ? GILT : '#3a2b1c'; c.strokeRect(bx, by, 36, 36); if (b[0]) runeGlyph(bx + 18, by + 18, 11, PALE, i + 2); else if (i < 4) { c.strokeStyle = 'rgba(201,165,83,0.3)'; c.setLineDash([3, 3]); c.strokeRect(bx + 6, by + 6, 24, 24); c.setLineDash([]); } });
text('Long wind · Thick hide', 70, yy + 64, 12, DIM);
yy += 84; text('The collar', 60, yy + 22, 15, DIM, true); text('with a pet, later', 150, yy + 22, 12, DIM);

// the choices for the chosen slot
board(370, 70, 420, 640, 'Guard-blow');
text('What the right button held and the left pressed does. One at a time.', 390, 112, 13, DIM);
const picks = [['the Bash', 'Breaks a block and throws the man; a low blow off a block.', 1, 1, 'bound before', 'the first shield'], ['the Charge', 'A rush: the first man in your way goes down, the next is pushed.', 2, 1, 'chosen', 'the first boar'], ['the Hook', 'An axe pulls his shield down. Needs an axe in hand.', 3, 0, '', 'Arnor’s teaching'], ['the Feint', 'A blow that does not land but opens his guard.', 4, 0, 'not known: the jarl’s hall', '']];
let py = 130; picks.forEach((p, i) => { const known = !!p[5]; well(390, py, 380, 108); if (p[4] === 'chosen') { c.strokeStyle = PALE; c.lineWidth = 2; c.strokeRect(390, py, 380, 108); }
  c.fillStyle = known ? '#4a3622' : '#231a12'; c.fillRect(402, py + 14, 56, 56); c.strokeStyle = known ? GILT : '#3a2b1c'; c.lineWidth = 1.5; c.strokeRect(402, py + 14, 56, 56); if (known) runeGlyph(430, py + 42, 18, PALE, p[2]); else text('?', 430, py + 50, 26, DIM, true, 'center');
  text(known ? p[0] : 'a rune not met', 472, py + 34, 18, known ? CREAM : DIM, true); if (known) { tier(480, py + 50, p[3], 3); text('tier ' + 'I'.repeat(p[3]), 522, py + 54, 11, DIM); }
  if (known) { c.font = '13px Alegreya'; c.fillStyle = DIM; const words = p[1].split(' '); let line = '', ly = py + 76; words.forEach(w => { if (c.measureText(line + w).width > 290) { c.fillText(line, 472, ly); line = ''; ly += 16; } line += w + ' '; }); c.fillText(line, 472, ly); }
  else text('where: ' + p[4].replace('not known: ', ''), 472, py + 60, 12, DIM);
  if (p[4] === 'chosen') text('● in the slot', 760, py + 24, 12, GREEN, true, 'right'); if (known && p[5]) text('from ' + p[5], 760, py + 100, 11, 'rgba(239,227,198,0.3)', false, 'right'); py += 118; });
text('Four fit this slot; two more wait in the world.', 390, 690, 12, DIM);

// the card of the chosen rune
board(820, 70, 340, 640, 'The Charge');
vellum(840, 110, 300, 580);
c.fillStyle = '#4a3622'; c.fillRect(950, 130, 80, 80); c.strokeStyle = GILT; c.lineWidth = 2; c.strokeRect(950, 130, 80, 80); runeGlyph(990, 170, 28, PALE, 2);
text('The Charge', 990, 240, 24, '#2b2016', true, 'center'); text('the boar’s rune', 990, 262, 14, '#6a5a3c', false, 'center'); tier(960, 280, 1, 3); text('tier I of III', 1000, 285, 12, '#6a5a3c');
const tale = ['“The boar does not ask whose shield', 'it is.”', '', 'Right held, left pressed: a rush three', 'strides long. The first man in your way', 'goes down; the next behind him is', 'pushed back. Needs no shield.', '', 'Wakes on blood: ready after three', 'blows landed.', '', 'Tier II (a boar’s blood at the blót):', 'two men go down.', 'Tier III (used fifty times): the rush', 'strikes with the weapon in hand.'];
let ty = 318; tale.forEach(l => { text(l, 858, ty, 14, l[0] === '“' || l === 'it.”' ? '#5a3a2c' : '#2b2016', false); ty += 19; });
c.fillStyle = '#5a1f1a'; c.fillRect(870, 630, 240, 40); c.strokeStyle = GILT; c.strokeRect(870, 630, 240, 40); text('Bind: a cut, 5 health', 990, 657, 16, CREAM, true, 'center');
text('(in the slot now; a cut again for another)', 990, 690 - 4, 11, '#6a5a3c', false, 'center');

// ---------- the toolbar with blood marks ----------
text('2. In play: the toolbar, nothing else', 30, 760, 18, CREAM, true);
c.fillStyle = 'rgba(10,8,6,0.0)';
const bx0 = 380; for (let i = 0; i < 6; i++) { c.fillStyle = '#1b1510'; c.fillRect(bx0 + i * 54, 770, 48, 48); c.strokeStyle = i === 0 ? PALE : '#4a3622'; c.lineWidth = i === 0 ? 2 : 1; c.strokeRect(bx0 + i * 54, 770, 48, 48); text(String(i + 1), bx0 + i * 54 + 6, 784, 11, DIM, true); }
// the slot marks to the right of the bar
const marks = [['Guard-blow', 2, 1.0], ['Dash', 1, 0.33], ['Swing', 4, 0.66]]; marks.forEach((m, i) => { const mx = bx0 + 6 * 54 + 30 + i * 70; c.fillStyle = '#1b1510'; c.beginPath(); c.arc(mx, 794, 20, 0, 7); c.fill(); runeGlyph(mx, 794, 11, m[2] >= 1 ? PALE : DIM, m[1]); bloodMark(mx, 794, 20, m[2]); text(m[0], mx, 832, 11, DIM, false, 'center'); });
text('the red ring fills a third with each blow you land; full, the rune is ready: right held, left pressed', 380, 852, 12, DIM);

// ================= Screen 3: the blót's offer =================
text('3. At the blót: three offered, one taken', 30, 900, 22, CREAM, true);
board(120, 930, 960, 560, 'The blót');
text('A boar’s blood on the fire. The fire gives; take one.', 600, 975, 15, DIM, false, 'center');
const offer = [['The Roll', 'the dash', 'A longer dash, and a blow that lands on it is a miss.', 'tier I', 1], ['The Charge II', 'the guard-blow', 'Two men go down before the rush, not one.', 'tier II · the boar’s blood', 2], ['The Gleaner', 'the band', 'Every bush gives twice; a picked bush grows back sooner.', 'tier I', 5]];
offer.forEach((o, i) => { const ox = 160 + i * 300; vellum(ox, 1000, 260, 430); c.fillStyle = '#4a3622'; c.fillRect(ox + 90, 1020, 80, 80); c.strokeStyle = GILT; c.lineWidth = 2; c.strokeRect(ox + 90, 1020, 80, 80); runeGlyph(ox + 130, 1060, 28, i === 1 ? GILT : PALE, o[4]); if (i === 1) { c.strokeStyle = RED; c.lineWidth = 2; c.strokeRect(ox + 86, 1016, 88, 88); }
  text(o[0], ox + 130, 1130, 22, '#2b2016', true, 'center'); text('for ' + o[1], ox + 130, 1152, 13, '#6a5a3c', false, 'center'); text(o[3], ox + 130, 1172, 12, i === 1 ? RED : '#6a5a3c', false, 'center');
  c.font = '14px Alegreya'; c.fillStyle = '#2b2016'; const words = o[2].split(' '); let line = '', ly = 1210; words.forEach(w => { if (c.measureText(line + w).width > 220) { c.fillText(line, ox + 20, ly); line = ''; ly += 19; } line += w + ' '; }); c.fillText(line, ox + 20, ly);
  c.fillStyle = '#5a1f1a'; c.fillRect(ox + 60, 1370, 140, 36); c.strokeStyle = GILT; c.strokeRect(ox + 60, 1370, 140, 36); text('Take', ox + 130, 1395, 16, CREAM, true, 'center'); });
text('What you put on the fire sets the offer: a dish, three common runes; a beast’s blood, one deeper among them; the other two are gone when you take one.', 600, 1470, 12, DIM, false, 'center');
text('Four blóts a year: four runes. The runes met in the world come besides, each where it is met.', 600, 1510, 12, DIM, false, 'center');

fs.mkdirSync(path.join(__dirname, '..', '..', 'docs', 'pictures'), { recursive: true });
const out = path.join(__dirname, '..', '..', 'docs', 'pictures', 'runes-mock.png'); fs.writeFileSync(out, cv.toBuffer('image/png')); console.log('wrote ' + out);
