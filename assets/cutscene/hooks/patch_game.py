"""patch_game.py: the cut-scene hooks laid into a copy of the game (Colin, AD, 2026-10-29). Run on the studio's copy to test; Clive, GD
applies the same changes to the game (HOOKS.md lists them; this script is the exact record of them).
  python patch_game.py <game copy root>
Edits templates/game.html and tools/build.py in that copy, puts src/cutscene.js, src/cutscene_editor.js and scenes/*.json there."""
import os, sys, shutil
ROOT = os.path.abspath(sys.argv[1]); HERE = os.path.dirname(os.path.abspath(__file__)); WORK = os.path.dirname(HERE)
def sub(text, old, new, count=1, where=''):
    if old not in text: raise SystemExit('PATCH: not found (%s): %r' % (where, old[:90]))
    return text.replace(old, new, count)
g = os.path.join(ROOT, 'templates', 'game.html'); s = open(g, encoding='utf8').read()
if 'csScene' in s: raise SystemExit('PATCH: already patched')
block = open(os.path.join(HERE, 'cs_block.js'), encoding='utf8').read()
s = sub(s, '__MUSIC__\n', '__MUSIC__\n__CUTSCENE__\n', where='the sources')                                                       # 1 the player and the editor, inlined
s = sub(s, "  /* ---------- Models (game.html?scene=models", block + "  /* ---------- Models (game.html?scene=models", where='the block')   # 2 the env and the editor's start
s = sub(s, "still: function () { return !!(raft && raft.aboard)", "still: function () { return !!CS.lock || !!(raft && raft.aboard)", where='still')   # 3 the input held
s = sub(s, "      cam.x = hw * 2 >= WX ? WX / 2 : Math.max(hw, Math.min(WX - hw, spx));", "      if (CS.cam) { spx = CS.cam.x; spy = CS.cam.y; z = zoom * (CS.cam.z || 1); hw = 200 / z; hh = 125 / z; cam.z = z; }   /* a cut-scene holds the view (src/cutscene.js eases it) */\n      cam.x = hw * 2 >= WX ? WX / 2 : Math.max(hw, Math.min(WX - hw, spx));", where='the view')   # 4
s = sub(s, "      if (caveFade > 0) { c.fillStyle = 'rgba(0,0,0,' + Math.min(1, caveFade / 0.7) + ')'; c.fillRect(0, 0, 400, 250); }", "      if (caveFade > 0) { c.fillStyle = 'rgba(0,0,0,' + Math.min(1, caveFade / 0.7) + ')'; c.fillRect(0, 0, 400, 250); }\n      csDraw(c);   /* a cut-scene's dusk, bars and fade; the editor's marks */", where='the overlay')   # 5
s = sub(s, "if (SCENE === 'dialogue') dlgItems(items);", "if (SCENE === 'dialogue') dlgItems(items); csItems(items);", where='the figures')   # 6
s = sub(s, "    m.spr = Sprites.person(c, PEOPLE, look, st, m.x + (m.leanX || 0)", "    if (m.csClip) { st = { face: m.face, clip: m.csClip, t: clock - (m.csT0 || 0) }; if (!m['warm_' + m.csClip]) { m['warm_' + m.csClip] = 1; Sprites.peopleWarm(PEOPLE, look, [m.csClip]); } }   /* a cut-scene's clip */\n    m.spr = Sprites.person(c, PEOPLE, look, st, m.x + (m.leanX || 0)", where='drawPerson')   # 7
s = sub(s, "    if (caveFade > 0) caveFade = Math.max(0, caveFade - dt);", "    if (caveFade > 0) caveFade = Math.max(0, caveFade - dt);\n    csTick(dt);   /* the cut-scene and the editor */", where='the tick')   # 8
s = sub(s, "if (SCENE === 'dialogue') dlgScene(); }", "if (SCENE === 'dialogue') dlgScene(); if (SCENE === 'cutscene') csScene(); }", where='the start')   # 9
s = sub(s, "(SCENE === 'models' ? 'game.save.models' : 'game.save')", "(SCENE === 'models' ? 'game.save.models' : SCENE === 'cutscene' ? 'game.save.cutscene' : 'game.save')", where='the save')   # 10
s = sub(s, "  cv.addEventListener('mousedown', function (e) {", "  cv.addEventListener('mousedown', function (e) {\n    if (SCENE === 'cutscene' && CS.picking) { var csp = toScreen(e); if (csPickAt(csp.x, csp.y)) return; }   /* the editor's Pick */", where='the pick')   # 11
open(g, 'w', encoding='utf8', newline='\n').write(s)
b = os.path.join(ROOT, 'tools', 'build.py'); t = open(b, encoding='utf8').read()
t = sub(t, "SRC['__SEA__'] = sea_art()", "SRC['__SEA__'] = sea_art()\nSRC['__CUTSCENE__'] = read('src', 'cutscene.js') + '\\n' + read('src', 'cutscene_editor.js')   # the cut-scenes (Colin, AD, 2026-10-29)\ndef scenes():\n    d = os.path.join(ROOT, 'scenes'); out = {}\n    if os.path.isdir(d):\n        for f in sorted(os.listdir(d)):\n            if f.endswith('.json'): out[f[:-5]] = json.load(open(os.path.join(d, f), encoding='utf-8'))\n    return json.dumps(out, separators=(',', ':'))\nSRC['__SCENES__'] = scenes()", where='build.py')
open(b, 'w', encoding='utf8', newline='\n').write(t)
for f in ('cutscene.js', 'cutscene_editor.js'): shutil.copy(os.path.join(WORK, 'src', f), os.path.join(ROOT, 'src', f))
os.makedirs(os.path.join(ROOT, 'scenes'), exist_ok=True)
for f in os.listdir(os.path.join(WORK, 'scenes')):
    if f.endswith('.json'): shutil.copy(os.path.join(WORK, 'scenes', f), os.path.join(ROOT, 'scenes', f))
print('PATCH done: 13 changes in game.html, 1 in build.py, the sources and scenes copied')
