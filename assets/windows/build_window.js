/* build_window.js: the house window, plain and lit, and the light it throws (Colin, AD, 2026-10-28; Clive, GD's playtest ask, picked by
   Robin: "new windows that glow"). Drawn in code like the walls. The plain window goes into the wall's kept picture; the glow and the pools
   are an overlay drawn live over it with an amount a (0 to 1), so the kept picture never changes. Composite only, no pixel reads.
     BuildWindow.h(c, x0, yb, h, m, seed)        in drawH in place of shutterWindow: x0 the edge's left, yb its foot, h the wall's height, m the WALLS entry
     BuildWindow.v(c, xl, yt, th, len, m, seed)  in drawV in place of the dark rect: the wall's top seen from above, len = TS
     BuildWindow.glowH(c, x0, yb, h, a)          the H window lit from inside: warm opening, a halo, light on the sill and a pool on the ground before it
     BuildWindow.glowV(c, xl, yt, th, len, a)    the V window lit: a warm slot and light thrown out to both sides of the wall's top
     BuildWindow.pool(c, x, y, w, len, dir, a, kind)  light through an opening onto a floor: from an opening w wide centred at (x, y),
                                                   fanning len units toward dir 's'|'n'|'e'|'w'; kind 'day' (sunlight in, pale warm) or 'fire' (firelight out, amber)
   The window: a square hole framed in dark timber with a heavier lintel, a shutter of two boards and a Z-brace hung open on its right, a sill.
   No glass in this age; inside a dark room with a beam's line. Lit, the hole fills with firelight, bright at the foot where the fire is. */
var BuildWindow = (function () {
'use strict';
var LINE = '#231a16', DARK = '#241a14';
function box(c, x, y, w, h, fill, lw) { c.fillStyle = fill; c.fillRect(x, y, w, h); c.strokeStyle = LINE; c.lineWidth = lw || 0.7; c.strokeRect(x, y, w, h); }
function geomH(x0, yb, h) { var w = 12, wh = Math.round(h * 0.42), x = x0 + 7, y = yb - h + 8; return { x: x, y: y, w: w, h: wh }; }
function h(c, x0, yb, hh, m, seed) {
  var g = geomH(x0, yb, hh), dark = (m && m.dark) || '#4a3626', top = (m && m.top) || '#7a5a3c';
  box(c, g.x, g.y, g.w, g.h, DARK, 0.8);
  c.strokeStyle = 'rgba(90,70,52,0.55)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(g.x + 1, g.y + g.h * 0.32); c.lineTo(g.x + g.w - 1, g.y + g.h * 0.36); c.stroke();   // a beam in the dark room
  c.fillStyle = 'rgba(255,220,150,0.08)'; c.fillRect(g.x + 1, g.y + g.h * 0.55, g.w - 2, g.h * 0.45 - 1);
  box(c, g.x - 2, g.y, 2, g.h, dark, 0.6); box(c, g.x + g.w, g.y, 2, g.h, dark, 0.6);                       // the jambs
  box(c, g.x - 3, g.y - 3, g.w + 6, 3, top, 0.7); c.fillStyle = 'rgba(255,240,205,0.35)'; c.fillRect(g.x - 2.6, g.y - 2.7, g.w + 5.2, 0.7);   // the lintel, its lit top
  var sx = g.x + g.w + 2, sw = g.w * 0.62;                                                                   // the shutter, open on its right
  c.fillStyle = '#7a5a3e'; c.beginPath(); c.moveTo(sx, g.y - 0.5); c.lineTo(sx + sw, g.y + 1); c.lineTo(sx + sw, g.y + g.h - 0.5); c.lineTo(sx, g.y + g.h + 0.5); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.6; c.stroke();
  c.strokeStyle = 'rgba(35,26,22,0.45)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(sx + sw / 2, g.y + 0.5); c.lineTo(sx + sw / 2, g.y + g.h); c.moveTo(sx + 0.5, g.y + g.h * 0.2); c.lineTo(sx + sw - 0.5, g.y + g.h * 0.24); c.lineTo(sx + 0.5, g.y + g.h * 0.76); c.lineTo(sx + sw - 0.5, g.y + g.h * 0.8); c.stroke();   // two boards and the Z-brace
  c.fillStyle = 'rgba(255,240,205,0.25)'; c.fillRect(sx + 0.4, g.y + 0.5, 0.8, g.h - 1);
  box(c, g.x - 3.5, g.y + g.h, g.w + 7, 2.2, top, 0.6); c.fillStyle = 'rgba(255,240,205,0.35)'; c.fillRect(g.x - 3, g.y + g.h + 0.3, g.w + 6, 0.6);   // the sill
  c.fillStyle = 'rgba(20,14,10,0.25)'; c.fillRect(g.x - 3, g.y + g.h + 2.2, g.w + 6, 1.4);                 // its shadow on the wall
}
function v(c, xl, yt, th, len, m, seed) {
  var top = (m && m.top) || '#7a5a3c', dark = (m && m.dark) || '#4a3626', y0 = yt + len * 0.28, y1 = yt + len * 0.72;
  box(c, xl + 0.6, y0, th - 1.2, y1 - y0, DARK, 0.6);                                                       // the hole through the wall's top
  box(c, xl - 0.6, y0 - 1.6, th + 1.2, 1.6, top, 0.5); box(c, xl - 0.6, y1, th + 1.2, 1.6, top, 0.5);         // the jambs' ends
  c.fillStyle = '#7a5a3e'; c.beginPath(); c.moveTo(xl + th, y1); c.lineTo(xl + th + 4.5, y1 - 1.5); c.lineTo(xl + th + 4.5, y1 - (y1 - y0) * 0.65); c.lineTo(xl + th, y1 - (y1 - y0) * 0.6); c.closePath(); c.fill(); c.strokeStyle = LINE; c.lineWidth = 0.5; c.stroke();   // the shutter swung out, seen from above
}
function halo(c, x, y, r, a, col) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + (0.5 * a) + ')'); g.addColorStop(0.4, 'rgba(' + col + ',' + (0.18 * a) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
function glowH(c, x0, yb, hh, a) {
  if (!(a > 0)) return; var g = geomH(x0, yb, hh);
  c.save(); c.globalAlpha = a; var f = c.createLinearGradient(0, g.y, 0, g.y + g.h); f.addColorStop(0, '#d8843a'); f.addColorStop(0.6, '#f4b75c'); f.addColorStop(1, '#ffe2a0');
  c.fillStyle = f; c.fillRect(g.x + 0.4, g.y + 0.4, g.w - 0.8, g.h - 0.8);
  c.strokeStyle = 'rgba(70,40,20,0.7)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(g.x + 0.5, g.y + g.h * 0.32); c.lineTo(g.x + g.w - 0.5, g.y + g.h * 0.36); c.stroke();   // the beam against the light
  c.fillStyle = 'rgba(110,60,30,0.55)'; c.beginPath(); c.moveTo(g.x + 0.4, g.y + 0.4); c.lineTo(g.x + g.w * 0.38, g.y + 0.4); c.quadraticCurveTo(g.x + g.w * 0.22, g.y + g.h * 0.6, g.x + g.w * 0.3, g.y + g.h - 0.4); c.lineTo(g.x + 0.4, g.y + g.h - 0.4); c.closePath(); c.fill();   // a hanging drawn half across
  c.restore();
  c.save(); c.globalCompositeOperation = 'lighter';
  halo(c, g.x + g.w / 2, g.y + g.h * 0.6, 22, a, '255,170,80');
  c.fillStyle = 'rgba(255,190,110,' + (0.35 * a) + ')'; c.fillRect(g.x - 3, g.y + g.h, g.w + 6, 1.2);                      // the sill's lit edge
  pool(c, g.x + g.w / 2, yb + 1, g.w + 6, 30, 's', a, 'fire', true);                                                  // the light on the ground before the wall
  c.restore();
}
function glowV(c, xl, yt, th, len, a) {
  if (!(a > 0)) return; var y0 = yt + len * 0.28, y1 = yt + len * 0.72, cx = xl + th / 2, cy = (y0 + y1) / 2;
  c.save(); c.globalAlpha = a; c.fillStyle = '#f4b75c'; c.fillRect(xl + 1, y0 + 0.4, th - 2, y1 - y0 - 0.8); c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; halo(c, cx, cy, 16, a, '255,170,80');
  pool(c, xl, cy, y1 - y0, 22, 'w', a * 0.8, 'fire', true); pool(c, xl + th, cy, y1 - y0, 22, 'e', a * 0.8, 'fire', true); c.restore();
}
function pool(c, x, y, w, len, dir, a, kind, inLighter) {
  if (!(a > 0)) return; var col = kind === 'fire' ? '255,176,90' : '255,228,170', k = kind === 'fire' ? 0.6 : 0.55, spread = kind === 'fire' ? 2.2 : 1.3;
  c.save(); if (!inLighter) c.globalCompositeOperation = kind === 'fire' ? 'lighter' : 'screen';
  var dx = dir === 'e' ? 1 : dir === 'w' ? -1 : 0, dy = dir === 's' ? 1 : dir === 'n' ? -1 : 0, px = -dy, py = dx, ex = x + dx * len, ey = y + dy * len * 0.75;   // the floor is foreshortened north to south (K)
  var gr = c.createLinearGradient(x, y, ex, ey); gr.addColorStop(0, 'rgba(' + col + ',' + (k * a) + ')'); gr.addColorStop(0.55, 'rgba(' + col + ',' + (k * 0.45 * a) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
  c.fillStyle = gr; c.beginPath(); c.moveTo(x + px * w / 2, y + py * w / 2); c.lineTo(ex + px * w * spread / 2, ey + py * w * spread / 2); c.lineTo(ex - px * w * spread / 2, ey - py * w * spread / 2); c.lineTo(x - px * w / 2, y - py * w / 2); c.closePath();
  if (c.filter !== undefined) c.filter = 'blur(1.5px)'; c.fill(); c.restore();
}
return { h: h, v: v, glowH: glowH, glowV: glowV, pool: pool, geomH: geomH };
})();
if (typeof module !== 'undefined') module.exports = BuildWindow;
