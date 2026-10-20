#!/usr/bin/env python3
"""Build the pages from the source files.

Usage:  python3 tools/build.py
Output in dist/: index.html (the start page), the editors (art-editor, sea-editor, village-editor), the
combat-arena and the game.
Each is a single self-contained file you can open in a browser or host anywhere.
"""
import hashlib
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)

SRC = {'__ART__': read('src', 'art.js'), '__LIB__': read('src', 'stylelab.js'), '__WORLD__': read('src', 'world.js'), '__CAVE__': read('src', 'cave.js'), '__AMBIENT__': read('src', 'ambient.js'), '__BUILD__': read('src', 'build.js'), '__ITEMS__': read('src', 'items.js'), '__RUNES__': read('src', 'runes.js'), '__HIRD__': read('src', 'hird.js'), '__NAV__': read('src', 'nav.js'), '__RUIN__': read('src', 'ruin.js'), '__YARD__': read('src', 'yard.js'), '__VILLAGE__': read('src', 'village.js'), '__GATHER__': read('src', 'gather.js'), '__FISHING__': read('src', 'fishing.js'), '__MUSIC__': read('src', 'music.js'), '__SFX__': read('src', 'sfx.js'), '__SPRITES_JS__': read('src', 'sprites.js'), '__COMBAT__': read('src', 'combat.js')}

# The Blender hero's sprite sheets (assets/sprites/hero, 2026-10-09): the Character Editor and the Blender Editor get each sheet's
# metadata inlined and the PNGs as paths beside dist/ (../assets/sprites/...), which load from file:// and from the workbench
# server rooted at the repo. (They were data URIs until 2026-10-09; eighteen Mixamo clips made that 25 MB of page.)
import base64, json, re
TAGS = {}
def sheet_tag(fp):
    if fp not in TAGS: TAGS[fp] = hashlib.md5(open(fp, 'rb').read()).hexdigest()[:8]
    return TAGS[fp]
def all_sprites():
    """every packed sheet under assets/sprites/<name>/<name>.json, for the Blender Editor"""
    root = os.path.join(ROOT, 'assets', 'sprites'); out = {}
    if not os.path.isdir(root): return 'null'
    for name in sorted(os.listdir(root)):
        jp = os.path.join(root, name, name + '.json')
        if not os.path.exists(jp): continue
        j = json.load(open(jp, encoding='utf-8')); imgs = {}
        for a in j['anims'].values():
            for f in a['sheets'].values():
                fp = os.path.join(root, name, f)   # tagged by its bytes (2026-10-15): a browser kept the old idle spear sheet under the new boxes and drew it in pieces
                imgs[f] = '../assets/sprites/' + name + '/' + f + ('?v=' + sheet_tag(fp) if os.path.exists(fp) else '')
        out[name] = {'meta': j, 'images': imgs}
    return json.dumps(out)
SRC['__SPRITES__'] = all_sprites()
def lore_lines():
    """the Lore Director's delivery (assets/lore/lore.json, copied from its out/lore): every entry with lines, canon or in-game, as { id: { mode, lines } };
    a rumour (handoff 3, 2026-10-17) also keeps its tier (whisper, lead, truth), heard, when and about (a list of lore ids)"""
    fp = os.path.join(ROOT, 'assets', 'lore', 'lore.json')
    if not os.path.exists(fp): return 'null'
    with open(fp, encoding='utf-8') as f: L = json.load(f)
    out = {}
    for e in L.get('entries', []):
        if e.get('lines') and e.get('status') in ('canon', 'in-game'):
            o = out[e['id']] = { 'mode': e.get('mode', 'variants'), 'lines': e['lines'] }
            for k in ('tier', 'heard', 'when'):
                if e.get(k): o[k] = e[k]
            if e.get('about'): o['about'] = [x.strip() for x in e['about'].split(',') if x.strip()] if isinstance(e['about'], str) else e['about']
    return json.dumps(out, ensure_ascii=False)
SRC['__LORE__'] = lore_lines()
def fire_art():
    """the Art Director's fires (assets/fires, copied whole from its out/fires/sheets, 2026-10-20): per fire its base, embers and
    flames sheets (tagged by their bytes) and its numbers (w, h, ax, ay, upp; the flames' frames and fps)"""
    d = os.path.join(ROOT, 'assets', 'fires'); jp = os.path.join(d, 'fires.json')
    if not os.path.exists(jp): return 'null'
    J = json.load(open(jp, encoding='utf-8'))
    def url(f): fp = os.path.join(d, f); return '../assets/fires/' + f + ('?v=' + sheet_tag(fp) if os.path.exists(fp) else '')
    for k, f in J.items():
        f['base'] = url(f['base']); f['embers'] = url(f['embers']); f['flames']['file'] = url(f['flames']['file'])
    return json.dumps(J)
SRC['__FIRES__'] = fire_art()
def item_icons():
    """the things in the hand as icons (art/build/items_icons.py), assets/sprites/items/<kind>_wood.png and _metal.png"""
    d = os.path.join(ROOT, 'assets', 'sprites', 'items'); out = {}
    if not os.path.isdir(d): return 'null'
    for fn in sorted(os.listdir(d)):
        m = re.match(r'^(\w+?)_(wood|metal)\.png$', fn)
        if m: out.setdefault(m.group(1), {})[m.group(2)] = '../assets/sprites/items/' + fn
    return json.dumps(out)
SRC['__ICONS__'] = item_icons()
def worn_icons():
    """the worn things as icons (the art studio's kit_icons.py, 2026-10-20): assets/sprites/worn/<layer>.png, near white where the game tints them"""
    d = os.path.join(ROOT, 'assets', 'sprites', 'worn'); out = {}
    if not os.path.isdir(d): return 'null'
    for fn in sorted(os.listdir(d)):
        if fn.endswith('.png'): out[fn[:-4]] = '../assets/sprites/worn/' + fn + '?v=' + hashlib.md5(open(os.path.join(d, fn), 'rb').read()).hexdigest()[:8]
    return json.dumps(out)
SRC['__WORN__'] = worn_icons()
def hud_art():
    """the panels' art (the Art Director's, 2026-10-20: out/hud/assets copied whole into assets/hud): <name>.png by name"""
    d = os.path.join(ROOT, 'assets', 'hud'); out = {}
    if not os.path.isdir(d): return 'null'
    for fn in sorted(os.listdir(d)):
        if fn.endswith('.png'): out[fn[:-4]] = '../assets/hud/' + fn + '?v=' + hashlib.md5(open(os.path.join(d, fn), 'rb').read()).hexdigest()[:8]
    return json.dumps(out)
SRC['__HUD__'] = hud_art()
def font_faces():
    """the book face, Alegreya (Robin's pick, 2026-10-20; SIL OFL, assets/fonts/OFL.txt), its Latin files from Google Fonts inlined so it works offline"""
    d = os.path.join(ROOT, 'assets', 'fonts'); out = []
    for fn, style in [('alegreya-latin.woff2', 'normal'), ('alegreya-italic-latin.woff2', 'italic')]:
        fp = os.path.join(d, fn)
        if os.path.exists(fp): out.append("@font-face{font-family:'Alegreya';font-style:%s;font-weight:400 900;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');}" % (style, base64.b64encode(open(fp, 'rb').read()).decode()))
    return ''.join(out)
SRC['__FONTS__'] = font_faces()
def prop_images():
    """the Blender set pieces (tools/props.js: assets/props/<name>.png and props.json): the peaks, the cave mouth"""
    jp = os.path.join(ROOT, 'assets', 'props', 'props.json')
    if not os.path.exists(jp): return 'null'
    j = json.load(open(jp, encoding='utf-8'))
    for name in j:                                    # a tag from the picture's own bytes: a browser that has the old picture cached fetches the new one (2026-10-12: the cave mouth was redone and the old one kept showing)
        fp = os.path.join(ROOT, 'assets', 'props', name + '.png'); tag = hashlib.md5(open(fp, 'rb').read()).hexdigest()[:8] if os.path.exists(fp) else '0'
        j[name]['src'] = '../assets/props/' + name + '.png?v=' + tag
    for sub, jn in [('trees', 'trees.json'), ('pieces', 'pieces.json'), ('plants', 'plants.json'), ('rocks', 'rocks.json'), ('camp', 'camp.json'), ('furniture', 'furniture.json')]:   # the Art Director's set pieces by folder (2026-10-20): the trees (three variants a kind, the felled trunk, a log), the benches
        tp = os.path.join(ROOT, 'assets', 'props', sub, jn)
        if not os.path.exists(tp): continue
        tj = json.load(open(tp, encoding='utf-8'))
        for name in tj:
            fp = os.path.join(ROOT, 'assets', 'props', sub, name + '.png'); tag = hashlib.md5(open(fp, 'rb').read()).hexdigest()[:8] if os.path.exists(fp) else '0'
            tj[name]['src'] = '../assets/props/' + sub + '/' + name + '.png?v=' + tag; j[name] = tj[name]
    return json.dumps(j)
SRC['__PROPIMG__'] = prop_images()
def file_tag(*parts):   # the sound bundle and the music scripts carry a hash of their bytes too (2026-10-16: a browser kept the old bundle)
    fp = os.path.join(ROOT, *parts)
    return hashlib.md5(open(fp, 'rb').read()).hexdigest()[:8] if os.path.exists(fp) else '0'
SRC['__TAG_SFX__'] = file_tag('assets', 'sfx', 'combat.js')
SRC['__TAG_DAY__'] = file_tag('assets', 'music', 'meadow-day.js')
SRC['__TAG_NIGHT__'] = file_tag('assets', 'music', 'meadow-night.js')

# page name in dist/  ->  template in templates/
PAGES = [
    ('index', 'index'),
    ('art-editor', 'art'),          # the Character, Creature, Object and Blender editors as one page (2026-10-09, the cleanup)
    ('sea-editor', 'sea'),
    ('combat-arena', 'combat'), ('village-editor', 'village'), ('game', 'game'),
]
# ?mute=1 on any page silences it: every sound the page makes goes to a gain of nothing (Robin, 2026-10-13: the sound was on
# while pages were tested by script, and the browser pane cannot be silenced). It goes in before the page's first script, so
# whatever makes an audio context later gets a quiet one. tools/visual/drive.js does the same for a page it drives.
MUTE = """<script>
(function () { if (!/[?&]mute(=[^0&][^&]*)?(&|$)/.test(location.search)) return; window.__mute = true;
  ['AudioContext', 'webkitAudioContext'].forEach(function (k) { var AC = window[k]; if (!AC || AC.__quiet) return; var Q = function (o) { var ac = new AC(o), g = ac.createGain(); g.gain.value = 0; g.connect(ac.destination); try { Object.defineProperty(ac, 'destination', { value: g }); } catch (e) { try { ac.suspend(); } catch (e2) {} } return ac; }; Q.prototype = AC.prototype; Q.__quiet = true; window[k] = Q; }); })();
</script>
"""
for page, template in PAGES:
    html = read('templates', template + '.html')
    for mark, code in SRC.items():
        html = html.replace(mark, code)
    if '<script>' in html: html = html.replace('<script>', MUTE + '<script>', 1)
    write(os.path.join(ROOT, 'dist', page + '.html'), html)
print('built ' + ', '.join(p for p, _ in PAGES) + ' in dist/')
