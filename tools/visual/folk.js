// Renders the people concepts (lib.concepts) in four views, and a grid of the styles, to folk.png.
// node tools/visual/folk.js
var createCanvas = require('@napi-rs/canvas').createCanvas, fs = require('fs');
var lib = require('../../src/art.js').lib;
var big = process.argv[2] === 'big', dirs = ['down', 'left', 'right', 'up'], cell = 60, S = big ? 4 : 1.6, cons = lib.concepts;
var W = Math.max(cons.length, 7) * cell, H = big ? 4 * cell : (4 + 8) * cell;
var cv = createCanvas(W * S, H * S), c = cv.getContext('2d'); c.scale(S, S);
c.fillStyle = '#8fd66d'; c.fillRect(0, 0, W, H);
function draw(sp, x, y, dir) { lib.setHero(sp); c.save(); c.translate(x, y); c.scale(1.1, 1.1); lib.playerD(c, 0, 0, dir, { phase: 0, amt: 0, t: 0.7, lx: 0, ly: 0, blink: 0, sq: 0 }, null); c.restore(); }
cons.forEach(function (cn, i) { var sp = lib.conceptSpec(cn.name); dirs.forEach(function (d, r) { draw(sp, i * cell + 30, r * cell + 52, d); }); c.fillStyle = '#243018'; c.font = '9px sans-serif'; c.textAlign = 'center'; c.fillText(cn.name, i * cell + 30, 10); });
if (big) { fs.writeFileSync('folk.png', cv.toBuffer('image/png')); console.log('wrote folk.png (big)'); process.exit(0); }
// the styles: rows of hair, beard, hat, clothes (front view), each over a matte base
var base = { matte: 1, col: { coat: '#8a7a5c', pants: '#4f4336', trim: '#5a3a26', hair: '#a86a3a' } };
var rows = [['hair', 9], ['beard', 5], ['hat', 6], ['clothes', 5]];
rows.forEach(function (rw, r) { for (var k = 0; k < rw[1]; k++) { var sp = JSON.parse(JSON.stringify(base)); sp[rw[0]] = k; if (rw[0] !== 'beard') sp.beard = 0; draw(sp, k * cell + 30, (5 + r) * cell + 52, 'down'); draw(sp, k * cell + 30 + 400, (5 + r) * cell + 52, 'left'); } c.fillStyle = '#243018'; c.textAlign = 'left'; c.fillText(rw[0] + ' 0..' + (rw[1] - 1), 4, (5 + r) * cell + 8); });
// back views of a few
[{ hair: 2 }, { hair: 3 }, { hair: 6, hat: 4 }, { clothes: 2, hair: 4 }, { clothes: 3, hat: 1 }, { hair: 1, beard: 3 }].forEach(function (o, k) { var sp = JSON.parse(JSON.stringify(base)); for (var q in o) sp[q] = o[q]; draw(sp, k * cell + 30, 9 * cell + 52, 'up'); draw(sp, k * cell + 30 + 400, 9 * cell + 52, 'right'); });
fs.writeFileSync('folk.png', cv.toBuffer('image/png')); console.log('wrote folk.png');
