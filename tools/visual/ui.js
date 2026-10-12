// The boards driven by hand (2026-10-12, the UI review): the mouse and the keys on the game's page, and pictures of what they show.
// Load tools/visual/drive.js first (it takes over the frame clock: H2.step(n)), write the page again, then load this file.
//   U.key('Tab')            a key down, two frames, up, twenty frames (the page's own keys: Tab, KeyE, KeyM, KeyB, Escape ...)
//   U.move(x, y)            the mouse to a place on the screen, in the HUD's own units (the screen is 400 by 250 of them)
//   U.click(x, y, button)   a click there (button 2 is the right one)
//   U.wheel(x, y, d)        the wheel there (d: 100 or -100)
//   U.shot(q)               the whole canvas as a JPEG data URL (it comes back as a file of the tool's: decode it from there)
//   U.crop(x, y, w, h, sc)  a part of it, in the same units, enlarged sc times
//   await U.sheet([a, b], cols)   several such pictures side by side
//   U.face("Georgia, serif")      a throwaway look at every board in another typeface: the page's own drawing with the face
//                                 swapped on its way into the canvas (U.face(null) puts it back). Nothing of it is in the game.
// Judge at Robin's size: resize the pane to 1920 by 1080 before loading the page (the canvas is then 1200 by 750).
window.U = (function () {
  var U = {};
  U.cv = function () { return document.querySelector('canvas'); };
  U.ev = function (type, x, y, button) {
    var cv = U.cv(), r = cv.getBoundingClientRect(), o = { clientX: r.left + x / 400 * r.width, clientY: r.top + y / 250 * r.height, button: button || 0, bubbles: true, cancelable: true };
    if (type === 'wheel') { o.deltaY = button; cv.dispatchEvent(new WheelEvent('wheel', o)); } else (type === 'mouseup' ? window : cv).dispatchEvent(new MouseEvent(type, o));
  };
  U.move = function (x, y) { U.ev('mousemove', x, y); };
  U.click = function (x, y, b) { U.ev('mousemove', x, y); U.ev('mousedown', x, y, b || 0); H2.step(1); U.ev('mouseup', x, y, b || 0); H2.step(2); };
  U.wheel = function (x, y, d) { U.ev('mousemove', x, y); U.ev('wheel', x, y, d); H2.step(1); };
  U.key = function (code, n) { H2.keyev(code, true); H2.step(2); H2.keyev(code, false); H2.step(n || 20); };
  U.shot = function (q) { return U.cv().toDataURL('image/jpeg', q || 0.88); };
  U.crop = function (x, y, w, h, sc) {
    var cv = U.cv(), k = cv.width / 400, c = document.createElement('canvas'); sc = sc || 1; c.width = w * k * sc; c.height = h * k * sc;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = sc !== Math.round(sc); g.drawImage(cv, x * k, y * k, w * k, h * k, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.9);
  };
  U.sheet = function (list, cols) {
    return Promise.all(list.map(function (s) { return new Promise(function (r) { var i = new Image(); i.onload = function () { r(i); }; i.src = s; }); })).then(function (L) {
      cols = cols || L.length; var w = Math.max.apply(null, L.map(function (i) { return i.width; })), h = Math.max.apply(null, L.map(function (i) { return i.height; })), c = document.createElement('canvas');
      c.width = cols * (w + 6); c.height = Math.ceil(L.length / cols) * (h + 6); var g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
      L.forEach(function (im, k) { g.drawImage(im, (k % cols) * (w + 6), Math.floor(k / cols) * (h + 6)); }); return c.toDataURL('image/jpeg', 0.88);
    });
  };
  var faceOn = false, face = null;
  U.face = function (f) {
    face = f || null; if (faceOn) return; faceOn = true;
    var ctx = U.cv().getContext('2d'), d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
    Object.defineProperty(ctx, 'font', { get: function () { return d.get.call(this); }, set: function (v) { d.set.call(this, face ? v.replace('system-ui, sans-serif', face) : v); }, configurable: true });
  };
  return U;
})();
