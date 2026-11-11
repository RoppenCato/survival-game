// Chapter 1's second half, by script (2026-11-10, docs/chapter-1-build-order.md step 9): from flint to the sail out, a step a call.
// It goes on where tools/visual/play0.js ends (the blót). Each step puts the hero where the thing is, does it through the game's own
// actions (the E rule, the crafting board's craft, the Building board's place, the engine's blows) and returns a line to read; a
// line with !! is a fault. What a step is GIVEN (not earned) it says: pelts, leather, the lessons. P1.counts() says what was
// gathered and spent, for the balance.
// Run in the page: open dist/game.html?mute=1, start a game, eval this file, then call ONE A CALL, in order:
//   P1.setup()  P1.flint()  P1.tools()  P1.pine()  (wait)  P1.log()  P1.pine()  (wait)  P1.log()  P1.saltvik()  P1.flax()  P1.loom()  P1.stone()  P1.saveLoad()
//   P1.bear()  P1.cape()  P1.lookout()  P1.yard(i)  P1.ship()  P1.sail()  P1.end()     (the ship asks two logs: fell and split twice; a felled tree needs a real second or two before its trunk lies; P1.yard(i) builds on island i, else the home's)
// (a tool call into the page must stay under about 45 real seconds; none of these takes five.)
window.P1 = (function () {
  var T = 32, got = {}, spent = {}, isles = {};
  function D() { return Combat.api.debug(); } function P() { return Combat.dbg().P; }
  function fast(n) { for (var i = 0; i < (n || 1); i++) D().tick(1 / 30); }
  function frames(n) { if (window.H2 && H2.ready()) H2.step((n || 1) * 2); else fast(n); }   /* (driven by drive.js the whole frame runs: the drops move and are taken only in a frame, found 2026-11-11 with the pane hidden) */
  function inv(k) { return D().inv[k] || 0; }
  function give(k, n, why) { D().addItem(k, n); got['given ' + k] = (got['given ' + k] || 0) + n; return k + ' x' + n + ' (given: ' + why + ')'; }
  function isle(test) { var w = D().world(), i = w.isles.findIndex(test); return i < 0 ? null : { i: i, q: w.isles[i] }; }
  function isleOf(x, y) { var w = D().world(), b = -1, bd = 1e9; w.isles.forEach(function (q, j) { var d = Math.hypot(x / T - q.x, y / T - q.y) / q.r; if (d < bd) { bd = d; b = j; } }); return b; }
  function went(x, y, what) { var i = isleOf(x, y), q = D().world().isles[i]; isles[i] = (isles[i] ? isles[i] + ', ' : '') + what; return i + ' (' + (q.role || '-') + ')'; }
  function nearest(test, from) { var b = null, bd = 1e12, p = from || P(); D().world().eachProp(function (o) { if (!test(o) || o.dying != null) return; var d = Math.hypot(o.x - p.x, o.y - p.y); if (d < bd) { bd = d; b = o; } }); return b; }
  function slotOf(kind, mat) { var sl = D().slots; for (var i = 0; i < sl.length; i++) if (sl[i] && sl[i].kind === 'item' && sl[i].item.kind === kind && (!mat || sl[i].item.mat === mat)) return i; return -1; }
  function hold(kind, mat) { var i = slotOf(kind, mat); if (i < 0) return false; var sl = D().slots; if (i > 5) { away(); var t = sl[0]; sl[0] = sl[i]; sl[i] = t; i = 0; fast(2); } if (D().hand() !== i) { Combat.api.barSelect(i); fast(4); } return D().hand() === i; }   /* (the bar's own hook: a made-up key event is not taken by the page) */
  function away() { var h = D().hand(); if (h >= 0) { Combat.api.barSelect(h); fast(4); } return D().hand() < 0; }
  function swing(n) { for (var k = 0; k < (n || 1); k++) { Combat.key('KeyJ', true); fast(4); Combat.key('KeyJ', false); fast(24); } }
  function make(id, n) { var r = D().recipes2.filter(function (q) { return q.id === id; })[0]; if (!r) return '!! no recipe ' + id; var out = []; for (var k = 0; k < (n || 1); k++) { for (var m in r.needs) spent[m] = (spent[m] || 0) + r.needs[m]; var ok = D().craft(r); fast(160); out.push(ok === false ? 'refused' : 'ok'); } return id + ': ' + out.join(','); }
  function e(want) { var w = D().eWhat(); if (want && !(w && want.test(w))) return '!! E says "' + w + '", wanted ' + want; D().eDo(); fast(8); return w; }
  function eHold(want, secs) { var w = D().eWhat(); if (want && !(w && want.test(w))) return '!! E says "' + w + '", wanted ' + want; D().fishing().hold(true); D().eDo(); fast(Math.ceil(secs * 30)); D().fishing().hold(false); fast(4); return w; }
  function pickUp(kind, tries) { for (var k = 0; k < (tries || 14); k++) { var dr = D().drops.filter(function (z) { return z.kind === kind; }); if (!dr.length) { if (k > 2) break; fast(15); continue; } P().x = dr[0].x; P().y = dr[0].y; frames(18); } }   /* stand on each drop of a kind until none lies (a drop cannot be taken in its first moment) */
  function errs() { var el = D().errlog(); return el.length ? ' !! errors: ' + el.slice(-2).join(' | ') : ''; }
  var P1 = {};
  P1.setup = function () {   // where play0 leaves off, as flags: the blót held, Old Aslak's craft open, both lessons learnt; stone tools, the bow and a quiver
    var s = D().seen, P0 = P(); ['met', 'raft', 'left', 'freeBuild', 'hamlet', 'aslakShop', 'blotAsked', 'villageBlot', 'shipwright', 'sailBoat', 'fishTaught'].forEach(function (k) { s[k] = 1; }); s.aslakB = 2;
    ['axe', 'pick', 'knife'].forEach(function (k) { if (slotOf(k, 'stone') < 0) D().addThing(Items.make(k, 'stone')); }); if (slotOf('bow') < 0) D().addThing(Items.make('bow', 'wood'));
    if (!D().equip.quiver) D().equip.quiver = Items.make('quiver', 'leather'); D().day().t = 120; fast(10);
    return 'setup: the flags of a hero after the blót (GIVEN: the lessons, stone tools, a bow, a quiver); hand ' + D().hand() + errs();
  };
  P1.flint = function () {   // an outer beach: nodules struck open with the hands, one flint each; none on the big island
    var w = D().world(), n0 = inv('flint'), big = 0, st = 0; w.eachProp(function (o) { if (o.is === 'flint') { var i = isleOf(o.x, o.y); if (w.isles[i].role === 'big') big++; if (w.isles[i].role === 'starter') st++; } });
    var q = isle(function (z) { return z.flint && z.role === 'home'; }); P().x = q.q.x * T; P().y = q.q.y * T; fast(5); away(); var k, f, where = null, t0 = Date.now();
    for (k = 0; k < 14 && Date.now() - t0 < 25000; k++) { f = nearest(function (o) { return o.is === 'flint'; }); if (!f) break; P().x = f.x - 14; P().y = f.y + 2; P().face = 0; P().faceVis = 0; fast(4); swing(3); frames(40); var d = D().drops.filter(function (z) { return z.kind === 'flint'; })[0]; if (d) { P().x = d.x; P().y = d.y; frames(30); } where = where || went(f.x, f.y, 'flint'); }
    var n = inv('flint') - n0; got.flint = (got.flint || 0) + n;
    return 'flint: ' + n + ' picked on island ' + where + ' with bare hands in ' + k + ' nodules' + (n < 8 ? ' !! fewer than 8' : '') + '; on the big island ' + big + (big ? ' !!' : '') + ', on the starter ' + st + (st ? ' !!' : '') + errs();
  };
  P1.tools = function () {   // the flint axe, pick and arrows from wood, flint and fibre
    var g = [give('wood', 12, 'felled on the way'), give('fiber', 8, 'pulled on the way')]; var out = [make('flintAxe'), make('flintPick'), make('flintArrows')];
    var q = D().quiver(), fa = q.slots.filter(function (z) { return z && z.kind === 'arrowFlint'; })[0], best = q.slots[q.sel];
    return 'tools: ' + out.join('; ') + '; flint axe ' + (slotOf('axe', 'flint') >= 0) + ', pick ' + (slotOf('pick', 'flint') >= 0) + '; flint arrows ' + (fa ? fa.n : 0) + ', the bow takes ' + (best && best.kind) + (best && best.kind === 'arrowFlint' ? '' : ' !!') + '; flint left ' + inv('flint') + '; ' + g.join(', ') + errs();
  };
  P1.pine = function () {   // an old pine: the stone axe will not bite, the flint axe fells it
    var op = nearest(function (o) { return o.is === 'oldPine'; }); if (!op) return '!! no old pine in the world'; P().x = op.x - 22; P().y = op.y + 2; P().face = 0; P().faceVis = 0; fast(6);
    hold('axe', 'stone'); var h0 = op.hp; swing(3); var hS = op.hp; hold('axe', 'flint'); swing(2); var hF = op.hp, t0 = Date.now(), n = 5; while (op.hp > 0 && Date.now() - t0 < 25000) { swing(3); n += 3; } fast(120);
    P1._pine = op; return 'old pine on island ' + went(op.x, op.y, 'an old pine') + ': the stone axe took ' + (h0 - hS) + (h0 - hS ? ' !!' : ' (will not bite)') + ', the flint axe ' + (hS - hF).toFixed(1) + ' in two blows; felled in ' + n + ' blows: ' + (op.hp <= 0) + errs();
  };
  P1.log = function () {   // the trunk gives one log; shouldered; set down; split with the axe into timber
    var tr = D().trunks().filter(function (t) { return t.tree === 'oldPine' && t.dying == null; }).sort(function (a, b) { return Math.hypot(a.x - P().x, a.y - P().y) - Math.hypot(b.x - P().x, b.y - P().y); })[0]; if (!tr) return '!! no old pine trunk lies here';
    var big0 = D().B.items.filter(function (q) { return q.bigLog; }).length; P().x = tr.x; P().y = tr.y + 14; P().face = -Math.PI / 2; P().faceVis = P().face; hold('axe', 'flint'); var n = 0; while (D().trunks().indexOf(tr) >= 0 && tr.logs > 0 && n < 12) { swing(1); n++; } fast(60);
    var logs = D().B.items.filter(function (q) { return q.bigLog; }), made = logs.length - big0, lg = logs[logs.length - 1]; if (!lg) return '!! the trunk gave no log';
    P().x = lg.x - 10; P().y = lg.y + 12; fast(6); away(); var e1 = e(/Shoulder/), car = JSON.stringify(D().raidInfo().carrying), v0 = P().x; Combat.key('KeyD', true); fast(60); Combat.key('KeyD', false); var pace = (P().x - v0) / 2; var e2 = e(/Set it down/); hold('axe', 'flint'); var lg2 = D().B.items.filter(function (q) { return q.bigLog; }).pop(); P().x = lg2.x - 10; P().y = lg2.y + 12; fast(6); var t0 = inv('timber'), e3 = e(/Split/); frames(30); pickUp('timber', 24); var tm = inv('timber') - t0; got.timber = (got.timber || 0) + tm; got['old pines felled'] = (got['old pines felled'] || 0) + 1;
    return 'the log: the trunk gave ' + made + (made === 1 ? '' : ' !!') + ' in ' + n + ' blows; E "' + e1 + '", carrying ' + car + ', pace ' + Math.round(pace) + ' a second; E "' + e2 + '"; E "' + e3 + '": timber ' + tm + (tm === 6 ? '' : ' !!') + errs();
  };
  P1.saltvik = function () {   // Jorunn: flint, a wolf's pelt and leather for salt and the loom's parts
    var vs = D().villages(), si = vs.findIndex(function (v) { return v.name === 'Saltvik'; }); if (si < 0) return '!! no Saltvik'; var v = vs[si]; P().x = (v.tx + v.w / 2) * T; P().y = (v.ty + v.h / 2) * T; fast(40);
    var jr = D().folk().filter(function (f) { return f.trader; })[0]; if (!jr) return '!! no Jorunn at Saltvik'; jr.hidden = false; jr.abed = false; P().x = jr.x - 26; P().y = jr.y + 4; P().face = 0; fast(8); away();
    var need = 10 - inv('flint'), g = [give('wolfPelt', 4, 'wolves hunted at night'), give('leather', 6, 'boar and deer butchered')]; if (need > 0) g.push(give('flint', need, 'more nodules'));
    var e1 = e(/Trade/), say = jr.say, out = [make('swapSaltFlint'), make('swapSaltPelt'), make('swapLoom')];
    return 'Saltvik on island ' + went(jr.x, jr.y, 'Saltvik') + ': E "' + e1 + '", she says "' + (say || '').slice(0, 50) + '"; ' + out.join('; ') + '; salt ' + inv('salt') + (inv('salt') >= 7 ? '' : ' !!') + ', loom parts ' + inv('loomParts') + (inv('loomParts') === 1 ? '' : ' !!') + '; ' + g.join(', ') + errs();
  };
  P1.flax = function () {   // wild flax, pulled by hand: two a plant, eighteen for the sail
    var n0 = inv('flax'), where = null, k, t0 = Date.now(); away(); if (D().menuNow && D().menuNow()) { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); fast(4); }
    for (k = 0; k < 18 && Date.now() - t0 < 30000; k++) { var f = nearest(function (o) { return o.is === 'flax'; }); if (!f) break; P().x = f.x - 12; P().y = f.y + 6; fast(4); var w = D().eWhat(); if (!/flax/i.test(w || '')) { P().x = f.x + 10; fast(3); w = D().eWhat(); } D().eDo(); fast(20); pickUp('flax', 8); where = where || went(f.x, f.y, 'wild flax'); }
    var n = inv('flax') - n0; got.flax = (got.flax || 0) + n; return 'flax: ' + n + ' from ' + k + ' plants on island ' + where + (n >= 24 ? '' : ' !! fewer than 24') + errs();
  };
  P1.loom = function () {   // the loom raised at home; three bolts of sailcloth
    var q = isle(function (z) { return z.role === 'home' && z.feat === 'meadow'; }) || isle(function (z) { return z.role === 'home'; }); P().x = q.q.x * T; P().y = q.q.y * T; fast(20); P1._home = { x: P().x, y: P().y };
    var g = [give('wood', 10, 'felled at home'), give('fiber', 6, 'pulled at home')], r = null, dx; for (dx = 0; dx < 10 && !(r && r.ok); dx++) r = D().place(D().pieceIndex('loomBench'), P().x + 44 + dx * 20, P().y - 12); fast(8);
    var lm = D().B.items.filter(function (it) { return it.loom; }).pop(); if (!lm) return '!! the loom could not be raised: ' + JSON.stringify(r); P().mode = 'fight'; P().x = lm.x - 6; P().y = lm.y + 26; P().face = -1.57; fast(8); var e1 = e(/Weave/), out = make('sailcloth', 4);
    return 'the loom on island ' + went(lm.x, lm.y, 'home') + ': raised ' + !!(r && r.ok) + '; E "' + e1 + '"; ' + out + '; sailcloth ' + inv('sailcloth') + (inv('sailcloth') === 4 ? '' : ' !!') + ', flax left ' + inv('flax') + '; ' + g.join(', ') + errs();
  };
  P1.stone = function () {   // the claim stone: laid flat, carved (held), filled with the wolf's blood, raised (held), named
    if (D().menuNow && D().menuNow()) { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); fast(4); } var h = P1._home || { x: P().x, y: P().y }; P().x = h.x - 60; P().y = h.y + 80; fast(6);
    var g = [give('stone', 6, 'gathered'), give('wolfBlood', 1, 'a wolf butchered')], had = D().B.items.filter(function (it) { return it.name === 'claimStone'; }).length, r = null, k; for (k = 0; k < 8 && !(r && r.ok); k++) r = D().place(D().pieceIndex('claim'), P().x + 40 + k * 16, P().y - 30); fast(8);
    var st = D().B.items.filter(function (it) { return it.name === 'claimStone' && it.stage; }).pop(); if (!st) return '!! the stone could not be laid: ' + JSON.stringify(r) + (had ? ' (a stone stands already: ' + had + ')' : ''); P().mode = 'fight'; P().x = st.x; P().y = st.y + 20; fast(5); P1._stone = st;
    var a1 = eHold(/Carve/, 2), s1 = st.stage, a1b = eHold(/Carve/, 4.3), s2 = st.stage, a2 = e(/Fill/); fast(60); var s3 = st.stage, a3 = eHold(/Raise/, 2.3), s4 = st.stage;
    return 'the claim stone: laid ' + !!(r && r.ok) + '; carve let go at 2 s: ' + s1 + (s1 === 'flat' ? '' : ' !!') + '; held 4.3 s: ' + s2 + (s2 === 'carved' ? '' : ' !!') + '; "' + a2 + '": ' + s3 + (s3 === 'blood' ? '' : ' !!') + ', blood left ' + inv('wolfBlood') + '; "' + a3 + '": claim ' + st.claim + ', named ' + st.named + (st.claim && st.named ? '' : ' !!') + '; ' + g.join(', ') + errs();
  };
  P1.saveLoad = function () {   // the save holds what this chapter added: the stone, the loom, flint arrows, a log on the shoulder, logs behind the boat
    var before = { timber: inv('timber'), sailcloth: inv('sailcloth'), salt: inv('salt'), flint: inv('flint'), stone: D().B.items.filter(function (it) { return it.name === 'claimStone' && it.claim; }).length, loom: D().B.items.filter(function (it) { return it.loom; }).length, arrows: JSON.stringify(D().quiver().slots), clues: Object.keys(D().seen.clues || {}).length };
    D().saveNow ? D().saveNow() : null; var raw = null, key = null; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/save/i.test(k) && (localStorage.getItem(k) || '').length > 2000) { key = k; raw = localStorage.getItem(k); } }
    if (!raw) return '!! no save found in storage'; var sv = JSON.parse(raw), its = (sv.B && sv.B.items) || sv.items || [], txt = raw;
    var has = { stone: /"claimStone"/.test(txt) && /"named"/.test(txt), loom: /"loom":true/.test(txt), flintArrows: /arrowFlint/.test(txt), timber: /"timber"/.test(txt), sailcloth: /"sailcloth"/.test(txt) }, bad = Object.keys(has).filter(function (k2) { return !has[k2]; });
    P1._before = before; return 'save: key ' + key + ', ' + Math.round(raw.length / 1024) + ' kB; in it: ' + JSON.stringify(has) + (bad.length ? ' !! missing ' + bad.join(',') : '') + '; now reload the page and call P1.afterLoad(' + JSON.stringify(before) + ')' + errs();
  };
  P1.afterLoad = function (b) {
    var now = { timber: inv('timber'), sailcloth: inv('sailcloth'), salt: inv('salt'), flint: inv('flint'), stone: D().B.items.filter(function (it) { return it.name === 'claimStone' && it.claim; }).length, loom: D().B.items.filter(function (it) { return it.loom; }).length, arrows: JSON.stringify(D().quiver().slots), clues: Object.keys(D().seen.clues || {}).length }, bad = Object.keys(b).filter(function (k) { return b[k] !== now[k]; });
    return 'after the reload: ' + JSON.stringify(now) + (bad.length ? ' !! changed: ' + bad.join(',') : ' (all as saved)') + errs();
  };
  P1.bear = function () {   // the Old Man: where he is, how strong, what his death gives
    var w = D().world(), bq = isle(function (z) { return z.bear; }); if (!bq) return '!! no island has the bear'; P().x = bq.q.x * T; P().y = bq.q.y * T; fast(150);
    var om = Combat.dbg().W.enemies.filter(function (en) { return en.oldMan; })[0]; if (!om) return '!! the Old Man is not on island ' + bq.i + (D().seen.oldManDead ? ' (he is dead already)' : ''); var wolfHp = 22, line = 'the Old Man on island ' + went(om.x, om.y, 'the Old Man') + ': health ' + om.hp + ' (' + (om.hp / wolfHp).toFixed(1) + ' wolves), a blow ' + om.cfg.dmg + ' of the hero\'s ' + P().maxHp;
    var runes0 = JSON.stringify(D().runes ? Object.keys((D().runes().lib) || {}) : []); P().x = om.x - 30; P().y = om.y; om.hp = 1; hold('axe', 'flint'); P().face = 0; P().faceVis = 0; var n = 0; while (!om.dead && n < 10) { P().x = om.x - 22; P().y = om.y; P().face = 0; swing(1); n++; } fast(90);
    var lib = D().runes ? Object.keys((D().runes().lib) || {}) : []; return line + '; brought to his last breath and struck: dead ' + om.dead + ', seen.oldManDead ' + !!D().seen.oldManDead + (D().seen.oldManDead ? '' : ' !!') + ', Bear strength in the library ' + (lib.indexOf('strongBack') >= 0) + (lib.indexOf('strongBack') >= 0 ? '' : ' !!') + errs();
  };
  function room(tx, ty, w, h) {   // a small house of plank walls and floor with a door to the south, built piece by piece from beside each piece
    var fl = D().pieceIndex('floor', 0), wl = D().pieceIndex('wall', 1), dr = D().pieceIndex('door'), n = 0, x, y, at = function (px, py) { P().x = px; P().y = py + 30; fast(1); };
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { at((tx + x + 0.5) * T, (ty + y + 0.5) * T); if ((D().place(fl, (tx + x + 0.5) * T, (ty + y + 0.5) * T) || {}).ok) n++; }
    for (x = 0; x < w; x++) { at((tx + x + 0.5) * T, ty * T); if ((D().place(wl, (tx + x + 0.5) * T, ty * T + 1) || {}).ok) n++; at((tx + x + 0.5) * T, (ty + h) * T); if ((D().place(x === Math.floor(w / 2) ? dr : wl, (tx + x + 0.5) * T, (ty + h) * T + 1) || {}).ok) n++; }
    for (y = 0; y < h; y++) { at(tx * T, (ty + y + 0.5) * T); if ((D().place(wl, tx * T + 1, (ty + y + 0.5) * T) || {}).ok) n++; at((tx + w) * T, (ty + y + 0.5) * T); if ((D().place(wl, (tx + w) * T + 1, (ty + y + 0.5) * T) || {}).ok) n++; }
    if (D().rebuildRooms) D().rebuildRooms();   /* (the rooms are found again when a frame is drawn: here by hand, the script draws none) */
    fast(10); return n;
  }
  P1.cape = function () {   // his pelt: a cape at a roofed bench, and a rug
    var g = [give('bearPelt', 2, 'the Old Man butchered at a table'), give('leather', 2, 'butchered'), give('sinew', 1, 'a boar'), give('wood', 60, 'felled for the house'), give('stone', 2, 'gathered')]; var h = P1._home || { x: P().x, y: P().y }; P().x = h.x + 160; P().y = h.y + 120; fast(10);
    var tx = Math.floor(P().x / T), ty = Math.floor(P().y / T), built = room(tx, ty, 3, 3), want = 9 + 6 + 6; P().x = (tx + 1.5) * T; P().y = (ty + 2.2) * T; fast(4);
    var r = D().place(D().pieceIndex('bench'), (tx + 1.5) * T, (ty + 0.8) * T); fast(8); var bn = D().B.items.filter(function (it) { return it.bench; }).pop(); P().mode = 'fight'; P().x = (tx + 1.5) * T; P().y = (ty + 1.9) * T; P().face = -1.57; fast(10);
    var c = make('bearCape'); for (var wq = 0; wq < 20 && slotOf('cloak', 'bear') < 0; wq++) fast(20); var has = slotOf('cloak', 'bear') >= 0, r2 = D().place(D().pieceIndex('bearRug'), (tx + 0.6) * T, (ty + 2.3) * T); fast(6); var rug = D().B.items.filter(function (it) { return it.name === 'rug' && it.bear; }).length; P().mode = 'fight';
    return 'the pelt: a house of ' + built + ' of ' + want + ' pieces; a bench in it ' + !!(r && r.ok) + '; ' + c + ', Bear Cape in the bag ' + has + (has ? '' : ' !!') + '; the rug laid ' + !!(r2 && r2.ok) + ' (' + rug + ')' + (rug ? '' : ' !!') + '; ' + g.join(', ') + errs();
  };
  P1.lookout = function () {   // the mountain's cairn opens the islands round; roseroot grows up there
    var lo = null, rr = 0; D().world().eachProp(function (o) { if (o.lookout && isleOf(o.x, o.y) === 1) lo = o; if (o.is === 'roseroot') rr++; }); if (!lo) return '!! no lookout on the big island'; D().seen.lookout = 0; P().x = lo.x + 20; P().y = lo.y + 30; fast(80);
    var r = nearest(function (o) { return o.is === 'roseroot'; }), n0 = inv('roseroot'), e1 = null; if (r) { away(); P().x = r.x - 12; P().y = r.y + 6; fast(5); e1 = D().eWhat(); D().eDo(); fast(30); pickUp('roseroot'); }
    return 'the lookout: seen.lookout ' + D().seen.lookout + (D().seen.lookout ? '' : ' !!') + ', islands queued for the map ' + D().wmPend().length + '; roseroot plants ' + rr + ', E "' + e1 + '", picked ' + (inv('roseroot') - n0) + (inv('roseroot') > n0 ? '' : ' !!') + errs();
  };
  P1.yard = function (isleI) {   // a pier from a beach out into the shallows, and the shipyard at its end; the pier's own cells are Pier.M wide (two tiles)
    var h = P1._home || { x: P().x, y: P().y }, w = D().world(), pi = D().pieceIndex('pier'), yi = D().pieceIndex('ship1'), M = Pier.M, g = [give('wood', 60, 'for the pier and the yard'), give('fiber', 12, 'for the yard'), give('stone', 8, 'for the yard')];
    var q = w.isles[isleI != null ? isleI : isleOf(h.x, h.y)], why = {}, built = null, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]], e0 = Math.ceil(q.r * 1.3 * T / M), cx0 = Math.floor(q.x * T / M), cy0 = Math.floor(q.y * T / M), mx, my, k, tries = 0;
    var can = function (idx, cx, cy, sx, sy) { P().x = (sx + 0.5) * M; P().y = (sy + 0.5) * M; fast(1); var t = D().target(idx, (cx + 0.5) * M, (cy + 0.5) * M); if (t && !t.ok && t.why) why[(idx === pi ? 'pier: ' : 'yard: ') + t.why] = 1; return !!(t && t.ok); };
    for (my = cy0 - e0; my <= cy0 + e0 && !built; my++) for (mx = cx0 - e0; mx <= cx0 + e0 && !built; mx++) { if (w.siteCode(Math.floor((mx + 0.5) * M / T), Math.floor((my + 0.5) * M / T)) !== 1) continue;
      for (k = 0; k < 4 && !built; k++) { var dx = DIRS[k][0], dy = DIRS[k][1]; if (tries > 60) break; if (!can(pi, mx, my, mx - dx, my - dy)) continue; if (w.siteCode(Math.floor((mx + dx + 0.5) * M / T), Math.floor((my + dy + 0.5) * M / T)) !== 0) continue; tries++;
        D().place(pi, (mx + 0.5) * M, (my + 0.5) * M); fast(2); var L = 1; while (L < 3 && can(pi, mx + L * dx, my + L * dy, mx + (L - 1) * dx, my + (L - 1) * dy)) { D().place(pi, (mx + L * dx + 0.5) * M, (my + L * dy + 0.5) * M); fast(2); L++; }
        if (L >= 2 && can(yi, mx + L * dx, my + L * dy, mx + (L - 1) * dx, my + (L - 1) * dy)) { var pl = D().place(yi, (mx + L * dx + 0.5) * M, (my + L * dy + 0.5) * M); fast(6); if (pl && pl.ok) built = { x: (mx + L * dx + 0.5) * M, y: (my + L * dy + 0.5) * M, pier: L, stand: [(mx + (L - 1) * dx + 0.5) * M, (my + (L - 1) * dy + 0.5) * M] }; } } }
    P().mode = 'fight'; if (!built) return '!! no pier and shipyard could be built on the home island: ' + Object.keys(why).join('; ') + '; ' + g.join(', '); P1._yard = built; P().x = built.stand[0]; P().y = built.stand[1]; fast(6);
    return 'the shipyard: a pier of ' + built.pier + ' pieces from the beach, the yard at its end, on island ' + went(built.x, built.y, 'the shipyard') + '; E says "' + D().eWhat() + '"; ' + g.join(', ') + errs();
  };
  P1.ship = function () {   // the small karve: what she asks for, and built with what was gathered
    var sy = D().shipNear ? D().shipNear(P()) : null; D().spOpen(sy || undefined); fast(6); var sp = D().shipPanel(); if (!sp) return '!! the shipyard\'s panel did not open'; sp.model = 'karve'; sp.kind = 'karve4'; if (D().spPrev) D().spPrev();
    var cost = Yard.HULLS.karve4.cost, lack = {}, k, g = []; for (k in cost) if (inv(k) < cost[k]) lack[k] = cost[k] - inv(k); var earned = !lack.timber && !lack.sailcloth; ['wood', 'leather'].forEach(function (m) { if (lack[m]) { g.push(give(m, lack[m], 'felled and butchered')); delete lack[m]; } });
    for (k in cost) spent[k] = (spent[k] || 0) + cost[k]; var n0 = D().fleetList ? D().fleetList().length : 0; D().spBuild(); fast(40); var rf = D().raftObj(), n1 = D().fleetList ? D().fleetList().length : 0;
    return 'the ship: she asks ' + JSON.stringify(cost) + '; timber and sailcloth from this run: ' + earned + (earned ? '' : ' !! lacking ' + JSON.stringify(lack)) + '; built: ' + (rf && rf.kind) + (rf && rf.kind === 'karve4' ? '' : ' !!') + ' (fleet ' + n0 + ' to ' + n1 + '); ' + g.join(', ') + errs();
  };
  P1.sail = function () {   // aboard her past the swell: the quest closes; a rowboat is turned back there
    var rf = D().raftObj(); if (!rf || rf.kind !== 'karve4') return '!! no karve to sail'; var w = D().world(), hw = w.homeWater, cx = hw.cx * T, cy = hw.cy * T; D().questDone && fast(1);
    var q0 = D().questDone('quest.aslak.boat'), near = { x: rf.x, y: rf.y }; rf.aboard = true; rf.x = cx + (hw.r + 50) * T; rf.y = cy; P().x = rf.x; P().y = rf.y; fast(90); var sw = w.swellAt(rf.x, rf.y), dw = !!D().seen.deepWater; fast(60); var q1 = D().questDone('quest.aslak.boat');
    return 'the sail out: the swell there ' + sw.toFixed(2) + '; seen.deepWater ' + dw + (dw ? '' : ' !!') + '; the quest A boat for deep water done before ' + q0 + ', after ' + q1 + (q1 ? '' : ' !!') + errs();
  };
  P1.counts = function () { return { got: got, spent: spent, islands: isles }; };
  P1.end = function () { var c = P1.counts(), n = Object.keys(c.islands).length; return 'the run: islands set foot on ' + n + ' ' + JSON.stringify(c.islands) + '; gathered or given ' + JSON.stringify(c.got) + '; spent ' + JSON.stringify(c.spent) + errs(); };
  return P1;
})();
