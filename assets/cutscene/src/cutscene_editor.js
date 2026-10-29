/* cutscene_editor.js: the Cut-scene Editor (Colin, AD, 2026-10-29; game.html?scene=cutscene). A panel over the game itself: the scene's
   steps in a list, the chosen step as editable JSON, Play, Play from here, Skip, Stop; Pick puts the next click on the world into the
   chosen step as a place from the anchor; the scene's places are marked on the ground while you edit; Check lists what is wrong;
   Save keeps it in this browser, Copy and Download give the JSON for the game's scenes/ folder, Paste takes one back.
   It needs the player's env and three things more from the page (ed):
     ed.pick(cb)          the next click on the world calls cb({ x, y }) in world units
     ed.overlay(fn)       the page calls fn(ctx, toScreen) after drawing the world, while the scene is edited (toScreen(x, y) -> { x, y })
     ed.scenes            { <id>: scene } the scenes the game ships (scenes/*.json, built in), to open and to start from
     ed.tick(fn)          the page calls fn(dt) every frame (the running scene ticks with the game)
   CutSceneEditor.open(env, ed) shows it. */
var CutSceneEditor = (function () {
'use strict';
var TEMPLATES = {
  wait: { do: 'wait', s: 1 }, fade: { do: 'fade', to: 1, s: 0.8 }, bars: { do: 'bars', to: 1, s: 0.6 },
  camera: { do: 'camera', at: [0, 0], zoom: 1.2, s: 2, ease: 'inout' }, follow: { do: 'camera', follow: 'hero', s: 1 }, release: { do: 'camera', release: true, s: 1 },
  place: { do: 'place', who: 'hero', at: [0, 40], face: 'n' }, walk: { do: 'walk', who: 'hero', to: [0, 20], speed: 40 }, face: { do: 'face', who: 'hero', toward: 'lead' },
  play: { do: 'play', who: 'hero', clip: 'idle_look', s: 1.5 }, say: { do: 'say', who: 'lead', text: 'A line.' }, talk: { do: 'talk', who: 'lead', lore: 'lore.id' },
  card: { do: 'card', title: 'THE PLACE', sub: 'a line under it' }, crowd: { do: 'crowd', group: 'folk', around: [0, 0], r: 70, n: 8, arc: 240 },
  fx: { do: 'fx', name: 'dark', to: 1, s: 2 }, music: { do: 'music', name: 'riteA' }, sound: { do: 'sound', name: 'thunder' }, flag: { do: 'flag', key: 'done', value: true },
  call: { do: 'call', fn: 'hookName', args: {} }, par: { do: 'par', steps: [{ do: 'wait', s: 1 }] }, show: { do: 'show', who: 'lead' }, hide: { do: 'hide', who: 'lead' },
  input: { do: 'input', on: false }, hud: { do: 'hud', on: false }
};
var CSS = 'position:fixed;right:12px;top:12px;width:380px;max-height:calc(100vh - 24px);overflow:auto;background:rgba(32,24,18,0.95);color:#efe6d2;border:1px solid #8a6a3a;border-radius:8px;padding:10px 12px;font:13px/1.4 Alegreya,Georgia,serif;z-index:30;box-shadow:0 4px 18px rgba(0,0,0,0.5)';
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function summary(s) {
  if (!s) return '?'; var w = s.who ? s.who + ' ' : '';
  switch (s.do) {
    case 'say': case 'talk': return w + (s.do) + ' “' + String(s.text || (s.lines && s.lines[0]) || s.lore || '').slice(0, 34) + '”';
    case 'walk': return w + 'walks' + (s.run ? ' (runs)' : ''); case 'place': return w + 'stands' + (s.face ? ' facing ' + s.face : '');
    case 'camera': return s.release ? 'camera back to the hero' : s.follow ? 'camera follows ' + s.follow : 'camera' + (s.zoom ? ' ×' + s.zoom : '') + (s.s ? ' over ' + s.s + ' s' : '');
    case 'play': return w + 'plays ' + s.clip; case 'fx': return 'fx ' + s.name + (s.to != null ? ' → ' + s.to : ''); case 'card': return 'card ' + (s.title || '');
    case 'par': return 'together: ' + (s.steps || []).map(function (q) { return q.do; }).join(', '); case 'call': return 'hook ' + s.fn;
    case 'fade': case 'bars': return s.do + ' → ' + s.to + (s.s ? ' over ' + s.s + ' s' : ''); case 'wait': return 'wait ' + s.s + ' s';
    default: return w + s.do;
  }
}
function open(env, ed) {
  var S = { scene: null, sel: 0, list: 'steps', run: null, el: null, picking: false, log: [] };
  var stored = null; try { stored = JSON.parse(localStorage.getItem('cutscene.current') || 'null'); } catch (e) {}
  var ids = Object.keys(ed.scenes || {});
  S.scene = stored || (ids.length ? JSON.parse(JSON.stringify(ed.scenes[ids[0]])) : { id: 'new', title: 'A new scene', anchor: 'hero', skip: true, cast: {}, steps: [{ do: 'wait', s: 1 }], end: [] });
  function save() { try { localStorage.setItem('cutscene.current', JSON.stringify(S.scene)); } catch (e) {} }
  function arr() { return S.list === 'end' ? (S.scene.end = S.scene.end || []) : S.scene.steps; }
  function play(from) {
    stop(); S.log = []; save();
    try { S.run = CutScene.start(S.scene, env, { from: from || 0, log: function (m) { S.log.push(m); if (S.log.length > 60) S.log.shift(); }, onEnd: function (why) { S.log.push('— ' + why + ' —'); S.run = null; draw(); } }); }
    catch (e) { S.log.push('error: ' + e.message); S.run = null; }
    draw();
  }
  function stop() { if (S.run) { S.run.stop(); S.run = null; } }
  ed.tick(function (dt) { if (S.run) { try { S.run.tick(dt); } catch (e) { S.log.push('error: ' + e.message); S.run.stop(); S.run = null; draw(); } } });
  ed.overlay(function (c, toS) {   // the scene's places on the ground while you edit: the anchor, then each step's place, numbered
    if (S.run) return; var A = (S.scene.anchor && env.place(S.scene.anchor)) || env.place('hero'); if (!A) return;
    function at(p) { if (!p) return A; if (Array.isArray(p)) return { x: A.x + p[0], y: A.y + p[1] }; var b = (p.at && env.place(p.at)) || A; return { x: b.x + (p.dx || 0), y: b.y + (p.dy || 0) }; }
    var q = toS(A.x, A.y); c.save(); c.strokeStyle = '#e8c060'; c.lineWidth = 2; c.beginPath(); c.arc(q.x, q.y, 9, 0, 7); c.moveTo(q.x - 13, q.y); c.lineTo(q.x + 13, q.y); c.moveTo(q.x, q.y - 13); c.lineTo(q.x, q.y + 13); c.stroke();
    c.font = 'bold 12px Alegreya,Georgia,serif'; c.textAlign = 'center';
    function mark(s, n, chosen) { var ps = []; if (s.at) ps.push(at(s.at)); if (s.around) ps.push(at(s.around)); if (s.to) { if (Array.isArray(s.to) && typeof s.to[0] === 'object') s.to.forEach(function (t) { ps.push(at(t)); }); else ps.push(at(s.to)); } if (s.do === 'par') (s.steps || []).forEach(function (q2) { mark(q2, n, chosen); });
      ps.forEach(function (p, j) { var r = toS(p.x, p.y); c.fillStyle = chosen ? 'rgba(232,96,76,0.95)' : 'rgba(30,22,16,0.8)'; c.beginPath(); c.arc(r.x, r.y, 8, 0, 7); c.fill(); c.strokeStyle = '#f2e6c8'; c.lineWidth = 1.2; c.stroke(); c.fillStyle = '#f2e6c8'; c.fillText(String(n), r.x, r.y + 4); if (j && s.do === 'walk') { var r0 = toS(ps[j - 1].x, ps[j - 1].y); c.strokeStyle = 'rgba(242,230,200,0.6)'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(r0.x, r0.y); c.lineTo(r.x, r.y); c.stroke(); c.setLineDash([]); } }); }
    arr().forEach(function (s, i) { mark(s, i + 1, i === S.sel); }); c.restore();
  });
  function draw() {
    var el = S.el; if (!el) {
      el = S.el = document.createElement('div'); el.id = 'csEditor'; el.style.cssText = CSS; document.body.appendChild(el);
      ['mousedown', 'mouseup', 'keydown', 'keyup', 'wheel'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }); });
      el.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b) return; act(b.getAttribute('data-a'), b.getAttribute('data-i')); });
      el.addEventListener('change', function (e) { if (e.target.id === 'csAdd' && e.target.value) { var L = arr(), t = JSON.parse(JSON.stringify(TEMPLATES[e.target.value])); L.splice(S.sel + 1, 0, t); S.sel = Math.min(L.length - 1, S.sel + 1); save(); draw(); }
        if (e.target.id === 'csOpen' && e.target.value) { stop(); S.scene = JSON.parse(JSON.stringify(ed.scenes[e.target.value])); S.sel = 0; save(); draw(); }
        if (e.target.id === 'csMeta') { try { var m = JSON.parse(e.target.value); ['id', 'title', 'anchor', 'skip', 'cast'].forEach(function (k) { if (m[k] !== undefined) S.scene[k] = m[k]; }); save(); e.target.style.borderColor = '#6a5236'; } catch (er) { e.target.style.borderColor = '#e0604c'; } } });
      el.addEventListener('input', function (e) { if (e.target.id === 'csStep') { try { arr()[S.sel] = JSON.parse(e.target.value); e.target.style.borderColor = '#6a5236'; save(); var row = el.querySelector('[data-row="' + S.sel + '"] .sum'); if (row) row.textContent = summary(arr()[S.sel]); } catch (er) { e.target.style.borderColor = '#e0604c'; } } });
    }
    var L = arr(), s = L[S.sel], probs = CutScene.check(S.scene), len = CutScene.length(S.scene);
    function btn(a, label, i, wide) { return '<button data-a="' + a + '"' + (i != null ? ' data-i="' + i + '"' : '') + ' style="' + (wide ? 'flex:1;' : '') + 'padding:4px 8px;margin:2px;border-radius:5px;border:1px solid #6a5236;background:#2a2018;color:#efe6d2;font:600 13px Alegreya,Georgia,serif;cursor:pointer">' + label + '</button>'; }
    var h = '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px">Cut-scene Editor</b><span style="color:#c9b48a">about ' + len.toFixed(1) + ' s' + (S.run ? ' · playing step ' + S.run.stepAt() : '') + '</span></div>';
    h += '<div style="margin:6px 0"><select id="csOpen" style="background:#2a2018;color:#efe6d2;border:1px solid #6a5236;border-radius:4px"><option value="">Open a scene of the game…</option>' + ids.map(function (k) { return '<option value="' + k + '">' + esc(k) + '</option>'; }).join('') + '</select></div>';
    h += '<textarea id="csMeta" style="width:100%;box-sizing:border-box;height:52px;background:#1e1712;color:#efe6d2;border:1px solid #6a5236;border-radius:5px;font:11px ui-monospace,Consolas,monospace">' + esc(JSON.stringify({ id: S.scene.id, title: S.scene.title, anchor: S.scene.anchor, skip: S.scene.skip, cast: S.scene.cast || {} })) + '</textarea>';
    h += '<div style="display:flex;flex-wrap:wrap">' + btn('play', '▶ Play', null, 1) + btn('from', '▶ From here', null, 1) + btn('skip', 'Skip', null, 1) + btn('stop', 'Stop', null, 1) + '</div>';
    h += '<div style="display:flex;gap:4px;margin-top:4px">' + btn('lsteps', (S.list === 'steps' ? '● ' : '') + 'Steps (' + S.scene.steps.length + ')', null, 1) + btn('lend', (S.list === 'end' ? '● ' : '') + 'End (' + (S.scene.end || []).length + ')', null, 1) + '</div>';
    h += '<div style="margin-top:6px;max-height:34vh;overflow:auto;border:1px solid #4a3a28;border-radius:5px">' + L.map(function (q, i) { return '<div data-a="sel" data-i="' + i + '" data-row="' + i + '" style="padding:3px 6px;cursor:pointer;' + (i === S.sel ? 'background:#5a3a22;' : '') + (q.wait === false ? 'color:#c9b48a;' : '') + '"><span style="color:#a8946c;display:inline-block;width:24px">' + (i + 1) + '</span><span class="sum">' + esc(summary(q)) + '</span>' + (q.note ? ' <i style="color:#a8946c">' + esc(q.note) + '</i>' : '') + '</div>'; }).join('') + '</div>';
    h += '<div style="display:flex;flex-wrap:wrap;margin-top:4px">' + btn('up', '↑') + btn('down', '↓') + btn('dup', 'Copy step') + btn('del', 'Delete') + btn('pick', S.picking ? 'Click the world…' : 'Pick a place') + '<select id="csAdd" style="margin:2px;background:#2a2018;color:#efe6d2;border:1px solid #6a5236;border-radius:4px"><option value="">+ Add…</option>' + Object.keys(TEMPLATES).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div>';
    h += '<textarea id="csStep" spellcheck="false" style="width:100%;box-sizing:border-box;height:120px;margin-top:4px;background:#1e1712;color:#efe6d2;border:1px solid #6a5236;border-radius:5px;padding:6px;font:12px ui-monospace,Consolas,monospace">' + esc(s ? JSON.stringify(s, null, 1) : '') + '</textarea>';
    h += probs.length ? '<div style="color:#e8a06a;margin-top:4px">' + probs.map(esc).join('<br>') + '</div>' : '<div style="color:#9fd27a;margin-top:4px">Well formed.</div>';
    h += '<div style="display:flex;flex-wrap:wrap;margin-top:4px">' + btn('copy', 'Copy JSON') + btn('dl', 'Download') + btn('paste', 'Paste JSON') + '</div>';
    h += '<textarea id="csOut" style="display:none;width:100%;box-sizing:border-box;height:120px;background:#1e1712;color:#efe6d2;border:1px solid #6a5236;border-radius:5px;font:11px ui-monospace,Consolas,monospace"></textarea>';
    h += '<div style="margin-top:4px;max-height:16vh;overflow:auto;font:11px ui-monospace,Consolas,monospace;color:#c9b48a">' + S.log.slice(-12).map(esc).join('<br>') + '</div>';
    el.innerHTML = h;
  }
  function act(a, i) {
    var L = arr();
    if (a === 'sel') { S.sel = +i; draw(); return; }
    if (a === 'play') { S.list = 'steps'; play(0); return; } if (a === 'from') { play(S.list === 'steps' ? S.sel : 0); return; }
    if (a === 'skip') { if (S.run) { S.run.skip(); S.run = null; } draw(); return; } if (a === 'stop') { stop(); draw(); return; }
    if (a === 'lsteps' || a === 'lend') { S.list = a === 'lend' ? 'end' : 'steps'; S.sel = 0; draw(); return; }
    if (a === 'up' && S.sel > 0) { L.splice(S.sel - 1, 0, L.splice(S.sel, 1)[0]); S.sel--; } else if (a === 'down' && S.sel < L.length - 1) { L.splice(S.sel + 1, 0, L.splice(S.sel, 1)[0]); S.sel++; }
    else if (a === 'dup' && L[S.sel]) { L.splice(S.sel + 1, 0, JSON.parse(JSON.stringify(L[S.sel]))); S.sel++; } else if (a === 'del' && L.length) { L.splice(S.sel, 1); S.sel = Math.max(0, Math.min(S.sel, L.length - 1)); }
    else if (a === 'pick') { S.picking = true; draw(); ed.pick(function (p) { S.picking = false; var A = (S.scene.anchor && env.place(S.scene.anchor)) || env.place('hero'), d = [Math.round(p.x - A.x), Math.round(p.y - A.y)], s = arr()[S.sel]; if (s) { if (s.do === 'walk') { if (Array.isArray(s.to) && typeof s.to[0] === 'object') s.to.push(d); else s.to = d; } else if (s.do === 'crowd') s.around = d; else s.at = d; } save(); draw(); }); return; }
    else if (a === 'copy' || a === 'dl') { var j = JSON.stringify(S.scene, null, 1), ta = S.el.querySelector('#csOut'); ta.style.display = 'block'; ta.value = j; ta.select(); try { document.execCommand('copy'); } catch (e) {} if (a === 'dl') { var u = URL.createObjectURL(new Blob([j], { type: 'application/json' })), ln = document.createElement('a'); ln.href = u; ln.download = (S.scene.id || 'scene') + '.json'; document.body.appendChild(ln); ln.click(); ln.remove(); } return; }
    else if (a === 'paste') { var t2 = S.el.querySelector('#csOut'); if (t2.style.display !== 'block') { t2.style.display = 'block'; t2.value = ''; t2.placeholder = 'Paste the scene JSON here, then press Paste JSON again'; t2.focus(); return; } try { S.scene = JSON.parse(t2.value); S.sel = 0; save(); } catch (e) { S.log.push('that is not JSON: ' + e.message); } }
    save(); draw();
  }
  draw();
  return { play: play, stop: stop, scene: function () { return S.scene; } };
}
return { open: open, TEMPLATES: TEMPLATES };
})();
if (typeof module !== 'undefined') module.exports = CutSceneEditor;
