// Drive any of our pages by hand (2026-10-12): the browser pane stops animating when hidden. Load this in the page, then reload the page with document.write(await (await fetch(location.href)).text()); H2.step(n) runs n frames.
(function () {
  var fake = performance.now(), cb = null, realRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function (f) { cb = f; return 0; }; performance.now = function () { return fake; };
  function step(n) { for (var i = 0; i < (n || 1); i++) { if (!cb) return false; fake += 1000 / 60; var f = cb; cb = null; f(fake); } return true; }
  var sheet = document.createElement('canvas'), g = sheet.getContext('2d'), TW = 250, TH = 230;
  function begin(cols, rows) { sheet.width = TW * cols; sheet.height = TH * rows; g.fillStyle = '#333'; g.fillRect(0, 0, sheet.width, sheet.height); }
  function snap(cv, cx, cy, label, col, row) { g.drawImage(cv, cx - TW / 2, cy - TH / 2, TW, TH, col * TW, row * TH, TW, TH); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(label, col * TW + 4, row * TH + 12); }
  function part(r0, n) { var c = document.createElement('canvas'); c.width = sheet.width; c.height = TH * n; c.getContext('2d').drawImage(sheet, 0, r0 * TH, sheet.width, TH * n, 0, 0, sheet.width, TH * n); return c.toDataURL('image/jpeg', 0.82); }
  function keyev(code, down) { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: code, key: code, bubbles: true, cancelable: true })); }
  window.H2 = { step: step, ready: function () { return !!cb; }, begin: begin, snap: snap, part: part, keyev: keyev, sheet: sheet, TW: TW, TH: TH };
})();
