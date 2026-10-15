// Click through a page's controls and catch what throws (2026-10-15, the cleanup): load in the page, then
//   await SMOKE.run({ skip: /regex/, wait: 250 })  ->  { clicked, errors: [{ label, msg }] }
// The page's storage is put back as it was afterwards, so toggles and choices clicked here change nothing that stays.
// Buttons that hand something to the game, throw work away or start a download are never clicked (SMOKE.SKIP).
(function () {
  var SKIP = /use in the game|use as|take back|defaults|delete|save|clear|start over|restart|new island|download|reset|update in game|give to the game/i;
  function snap() { var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; }
  function restore(o) { Object.keys(snap()).forEach(function (k) { if (!(k in o)) localStorage.removeItem(k); }); Object.keys(o).forEach(function (k) { localStorage.setItem(k, o[k]); }); }
  function label(b) { return (b.textContent || b.value || b.title || b.getAttribute('data-id') || '?').trim().replace(/\s+/g, ' ').slice(0, 60); }
  async function run(opt) {
    opt = opt || {}; var keep = snap(), errors = [], cur = '(load)', n = 0, skip = opt.skip || null;
    function onErr(e) { errors.push({ label: cur, msg: (e.message || (e.reason && e.reason.message) || String(e.reason || e)).slice(0, 200) }); }
    window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);
    var oce = console.error; console.error = function () { errors.push({ label: cur, msg: 'console.error: ' + Array.prototype.join.call(arguments, ' ').slice(0, 200) }); return oce.apply(console, arguments); };
    var list = Array.prototype.slice.call(document.querySelectorAll('button, input[type=button], input[type=checkbox], [role=button]'));
    for (var i = 0; i < list.length; i++) {
      var b = list[i], l = label(b);
      if (!b.isConnected || b.disabled || b.offsetParent === null) continue;
      if (SKIP.test(l) || (skip && skip.test(l))) continue;
      cur = l; n++;
      try { b.click(); } catch (e) { onErr(e); }
      await new Promise(function (r) { setTimeout(r, opt.wait || 200); });
    }
    await new Promise(function (r) { setTimeout(r, 600); });
    window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr); console.error = oce;
    if (opt.keep !== true) restore(keep);
    return { clicked: n, errors: errors };
  }
  window.SMOKE = { run: run, SKIP: SKIP, snap: snap, restore: restore };
})();
