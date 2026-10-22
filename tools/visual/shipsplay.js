// The ships at the shore, played in the real game (docs/ships-rework.md step 4, 2026-10-22): a ship is put off the starter
// island at five places round it, bow to the land, rowed in on W until she beaches or stops, then backed off on S. Each place
// says where she ended (beached on sand, or stopped by rock), and whether she came off again: never stuck.
// Run in the page, like tools/visual/startplay.js:
//   1. open dist/game.html?mute=1 with a game that has a ship (Admin's "A karve by you", or a rowboat built at a shipyard)
//   2. load tools/visual/drive.js (eval its text), wait a tenth of a second
//   3. load this file, then SH.place(0) ... SH.place(4), ONE A CALL (about 25 real seconds each); SH.kind('karve') first to
//      try a karve instead of the ship in use
(function () {
  function D() { return Combat.api.debug(); }
  function key(code, down) { H2.keyev(code, down); }
  var SH = window.SH = { res: [] };
  SH.kind = function (k) { var v = D().raftObj(); if (!v) return 'no ship'; v.kind = k; v.parts = Yard.designParts(k, v.look || {}); Yard.fit(v); return k + ': ' + Math.round(v.hw) + ' long'; };
  SH.place = function (k) {
    var d = D(), w = d.world(), v = d.raftObj(), P = Combat.dbg().P; if (!v) return 'no ship';
    var I = w.isles[0], T = 32, cx = I.x * T, cy = I.y * T, a = k / 5 * 2 * Math.PI + 0.3, r, x, y, coast = null;
    for (r = 0; r < I.r * T * 2; r += 16) { x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r; if (!w.isLand(x, y) && !w.isWade(x, y) && !coast) { coast = r; break; } }
    if (coast == null) return 'no coast found at place ' + k;
    var off = coast + (v.hw || 21) + 140;
    if (v.aboard) { d.raftUse(); H2.step(5); }
    v.x = cx + Math.cos(a) * off; v.y = cy + Math.sin(a) * off; v.h = a + Math.PI; v.vx = v.vy = v.speed = 0; v.beached = 0; v.trail = [];
    P.x = v.x - Math.sin(v.h) * ((v.hh || 21) + 14); P.y = v.y + Math.cos(v.h) * ((v.hh || 21) + 14); d.raftUse(); H2.step(5);   /* (at once: a hero put in the sea is walked back to land by the next frame) */
    if (!v.aboard) return 'place ' + k + ': could not board';
    var t = 0, still = 0, x0 = v.x, y0 = v.y; key('KeyW', true);
    while (t < 22 && !v.beached && still < 2) { H2.step(6); t += 0.1; still = Math.abs(v.speed) < 3 && t > 3 ? still + 0.1 : 0; }
    key('KeyW', false); H2.step(10);
    var end = v.beached ? 'beached on sand' : (still >= 2 ? 'stopped at the shore (rock or a steep bank)' : 'still going after 22 s'), xs = v.x, ys = v.y;
    key('KeyS', true); H2.step(240); key('KeyS', false); H2.step(10);
    var back = Math.hypot(v.x - xs, v.y - ys), res = { place: k, end: end, t: Math.round(t), came: Math.round(Math.hypot(xs - x0, ys - y0)), backed: Math.round(back), afloat: !v.beached, ok: back > 30 && !v.beached };
    SH.res.push(res); return (res.ok ? 'ok   ' : 'BAD  ') + 'place ' + k + ': rowed ' + res.came + ' in ' + res.t + ' s, ' + end + '; backed off ' + res.backed + (res.afloat ? ', afloat' : ', STILL ON THE SAND');
  };
})();
