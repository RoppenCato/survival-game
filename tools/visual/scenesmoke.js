// Press every row of a test scene's board and catch what throws (2026-10-15, the cleanup). Load in a game page opened with
// ?scene=<name>&mute=1, then  await SCENE_SMOKE.run({ wait: 700, skip: /regex/ })  ->  { rows, errors: [{ row, msg }] }.
// Rows that reload the page or throw the world away are skipped (SKIP). Errors are read from the page's own error log
// (Combat.api.debug().errlog(), which catches what a frame throws) and from window errors.
(function () {
  var SKIP = /start .*over|places:|houses:|heard as far|new island/i;
  async function run(opt) {
    opt = opt || {}; var D = Combat.api.debug(), errors = [], cur = '(load)', n0 = D.errlog().length;
    function onErr(e) { errors.push({ row: cur, msg: String(e.message || e.reason || e).slice(0, 200) }); }
    window.addEventListener('error', onErr);
    var rows = D.sceneRows(), done = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]; if (SKIP.test(r.name) || (opt.skip && opt.skip.test(r.name))) continue;
      cur = r.name; done.push(r.name);
      try { D.act(r.id); } catch (e) { onErr(e); }
      await new Promise(function (res) { setTimeout(res, opt.wait || 600); });
      var L = D.errlog(); for (var j = n0; j < L.length; j++) if (/^\d{4}-/.test(L[j])) errors.push({ row: cur, msg: L[j].slice(0, 260) }); n0 = L.length;
    }
    window.removeEventListener('error', onErr);
    return { scene: D.scene(), rows: done.length, errors: errors };
  }
  window.SCENE_SMOKE = { run: run, SKIP: SKIP };
})();
