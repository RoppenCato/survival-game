// Drive any of our pages by hand (2026-10-12): the browser pane stops animating when hidden. Load this in the page, then reload the page with document.write(await (await fetch(location.href)).text()); H2.step(n) runs n frames.
// When the pane is SHOWN the page that is being replaced is still alive: its next frame fires once more and hands its own loop to H2, in place of the new page's (2026-10-13: H2.step then drew into a canvas that was gone, and the screen stayed empty). So: load this, wait a tenth of a second, H2.drop(), and only then write the page again.
// A page driven from here makes no sound (Robin, 2026-10-13: the pane cannot be silenced): every audio context made after
// this is loaded plays into a gain of nothing. Open the page with ?mute=1 as well, so the page that is being replaced is
// silent too (its audio goes on after it has been written over).
(function () {
  window.__mute = true;
  ['AudioContext', 'webkitAudioContext'].forEach(function (k) { var AC = window[k]; if (!AC || AC.__quiet) return; var Q = function (o) { var ac = new AC(o), g = ac.createGain(); g.gain.value = 0; g.connect(ac.destination); try { Object.defineProperty(ac, 'destination', { value: g }); } catch (e) { try { ac.suspend(); } catch (e2) {} } return ac; }; Q.prototype = AC.prototype; Q.__quiet = true; window[k] = Q; });
  var fake = performance.now(), cb = null, realRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function (f) { cb = f; return 0; }; performance.now = function () { return fake; };
  function step(n) { for (var i = 0; i < (n || 1); i++) { if (!cb) return false; fake += 1000 / 60; var f = cb; cb = null; f(fake); } return true; }
  function sim(n, f) { for (var i = 0; i < (n || 1); i++) { fake += 1000 / 60; if (f(1 / 60) === false) return i; } return n; }   // n steps of the clock with no picture: f is the page's own step (Combat.api.debug().tick), fast enough for minutes of play in one call; false from f stops it
  var sheet = document.createElement('canvas'), g = sheet.getContext('2d'), TW = 250, TH = 230;
  function begin(cols, rows) { sheet.width = TW * cols; sheet.height = TH * rows; g.fillStyle = '#333'; g.fillRect(0, 0, sheet.width, sheet.height); }
  function snap(cv, cx, cy, label, col, row) { g.drawImage(cv, cx - TW / 2, cy - TH / 2, TW, TH, col * TW, row * TH, TW, TH); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(label, col * TW + 4, row * TH + 12); }
  function part(r0, n) { var c = document.createElement('canvas'); c.width = sheet.width; c.height = TH * n; c.getContext('2d').drawImage(sheet, 0, r0 * TH, sheet.width, TH * n, 0, 0, sheet.width, TH * n); return c.toDataURL('image/jpeg', 0.82); }
  function keyev(code, down) { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: code, key: code, bubbles: true, cancelable: true })); }
  window.H2 = { step: step, sim: sim, ready: function () { return !!cb; }, drop: function () { cb = null; }, begin: begin, snap: snap, part: part, keyev: keyev, sheet: sheet, TW: TW, TH: TH };
})();
