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

SRC = {'__ART__': read('src', 'art.js'), '__LIB__': read('src', 'stylelab.js'), '__WORLD__': read('src', 'world.js'), '__ROOFS__': read('src', 'roofs_winter.js'), '__CAVE__': read('src', 'cave.js'), '__AMBIENT__': read('src', 'ambient.js'), '__BUILD__': read('src', 'build.js'), '__ITEMS__': read('src', 'items.js'), '__RUNES__': read('src', 'runes2.js'), '__HIRD__': read('src', 'hird.js'), '__NAV__': read('src', 'nav.js'), '__RUIN__': read('src', 'ruin.js'), '__YARD__': read('src', 'yard.js'), '__SEALIB__': read('src', 'sea.js'), '__VILLAGE__': read('src', 'village.js'), '__GATHER__': read('src', 'gather.js'), '__FISHING__': read('src', 'fishing.js'), '__MUSIC__': read('src', 'music.js'), '__SFX__': read('src', 'sfx.js'), '__SPRITES_JS__': read('src', 'sprites.js'), '__COMBAT__': read('src', 'combat.js'), '__SEASONS__': read('src', 'seasons.js'), '__WEATHER__': read('src', 'weather.js'), '__SUN__': read('src', 'sun.js')}

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
        if e.get('list') and e.get('status') == 'canon' and not e.get('lines'): out[e['id']] = { 'list': e['list'] }   # a pool of names (names.ships.<model>, handoff 9, 2026-10-23)
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
def sea_art():
    """the Art Director's living sea (assets/sea, its out/sea/render, 2026-10-21): each piece's picture (tagged by its bytes), its origin on the water, its waterline cuts thinned to one in six, its pixels a metre"""
    d = os.path.join(ROOT, 'assets', 'sea')
    if not os.path.isdir(d): return 'null'
    out = {}
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.json'): continue
        n = fn[:-5]; pp = os.path.join(d, n + '.png')
        if not os.path.exists(pp): continue
        j = json.load(open(os.path.join(d, fn), encoding='utf-8'))
        out[n] = { 'src': '../assets/sea/' + n + '.png?v=' + hashlib.md5(open(pp, 'rb').read()).hexdigest()[:8], 'origin': j['origin'], 'water': j.get('water', [])[::6], 'ppm': j.get('ppm', 65) }
    return json.dumps(out)
SRC['__SEA__'] = sea_art()
def ship_models():
    """the ship models (Colin, AD's sheets, docs/ships-rework.md step 12, 2026-10-22): assets/ships/<kind>/<kind>.json (its frames,
    marks and layers) with each layer's picture tagged by its bytes"""
    d = os.path.join(ROOT, 'assets', 'ships'); out = {}
    if not os.path.isdir(d): return 'null'
    for kind in sorted(os.listdir(d)):
        jp = os.path.join(d, kind, kind + '.json')
        if not os.path.exists(jp): continue
        J = json.load(open(jp, encoding='utf-8'))
        def url(fn):
            fp = os.path.join(d, kind, fn)
            return '../assets/ships/' + kind + '/' + fn + '?v=' + hashlib.md5(open(fp, 'rb').read()).hexdigest()[:8] if os.path.exists(fp) else None
        U = { 'layers': {}, 'front': None, 'groups': {} }   # every part's picture by its tagged address (a karve's or a longship's groups too, 2026-10-23)
        for layer, fn in J.get('layers', {}).items():
            if url(fn): U['layers'][layer] = url(fn)
        if J.get('front') and J['front'].get('layer') and url(J['front']['layer']): U['front'] = url(J['front']['layer'])
        for g, G in (J.get('groups') or {}).items():
            U['groups'][g] = { l: url(fn) for l, fn in G.get('layers', {}).items() if url(fn) }
        J['urls'] = U; out[kind] = J
    return json.dumps(out)
SRC['__SHIPS__'] = ship_models()
def item_icons():
    """the things in the hand as icons (art/build/weapon_icons.py through tools/icons.js since 2026-10-22), assets/sprites/items/<kind>_wood.png and _metal.png, each with a tag from its bytes (2026-10-22: the icons were remade, and a browser keeps a picture it has)"""
    d = os.path.join(ROOT, 'assets', 'sprites', 'items'); out = {}
    if not os.path.isdir(d): return 'null'
    for fn in sorted(os.listdir(d)):
        m = re.match(r'^(\w+?)_(wood|metal)\.png$', fn)
        if m: out.setdefault(m.group(1), {})[m.group(2)] = '../assets/sprites/items/' + fn + '?v=' + sheet_tag(os.path.join(d, fn))
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
def stack_icons():
    """the materials and the food as icons (the art studio's item_icons.py, 2026-10-22): assets/sprites/icons/<kind>.png, one a kind, untinted, each with a tag from its bytes"""
    d = os.path.join(ROOT, 'assets', 'sprites', 'icons'); out = {}
    if not os.path.isdir(d): return 'null'
    for fn in sorted(os.listdir(d)):
        if fn.endswith('.png'): out[fn[:-4]] = '../assets/sprites/icons/' + fn + '?v=' + sheet_tag(os.path.join(d, fn))
    return json.dumps(out)
SRC['__STACKICONS__'] = stack_icons()
def hud_art():
    """the panels' art (the Art Director's, 2026-10-20: out/hud/assets copied whole into assets/hud): <name>.png by name"""
    d = os.path.join(ROOT, 'assets', 'hud'); out = {}
    if not os.path.isdir(d): return 'null'
    for fn in sorted(os.listdir(d)):
        if fn.endswith('.png'): out[fn[:-4]] = '../assets/hud/' + fn + '?v=' + hashlib.md5(open(os.path.join(d, fn), 'rb').read()).hexdigest()[:8]
    pd = os.path.join(d, 'pieces')                      # the Building board's cell icons for the buildable set pieces (the Art Director's villages plan step 7, 2026-10-20): pieces/<picture name>
    if os.path.isdir(pd):
        for fn in sorted(os.listdir(pd)):
            if fn.endswith('.png'): out['pieces/' + fn[:-4]] = '../assets/hud/pieces/' + fn + '?v=' + hashlib.md5(open(os.path.join(pd, fn), 'rb').read()).hexdigest()[:8]
    td = os.path.join(d, 'talk')                        # the talk window's own pieces (Colin, AD's, Robin's pick of 2026-10-22): talk/<name>
    if os.path.isdir(td):
        for fn in sorted(os.listdir(td)):
            if fn.endswith('.png'): out['talk/' + fn[:-4]] = '../assets/hud/talk/' + fn + '?v=' + hashlib.md5(open(os.path.join(td, fn), 'rb').read()).hexdigest()[:8]
    sd = os.path.join(d, 'ship')                        # the shipyard panel's clothes (Colin, AD's step 13 of the ships rework, 2026-10-23): ship/<name>
    if os.path.isdir(sd):
        for fn in sorted(os.listdir(sd)):
            if fn.endswith('.png'): out['ship/' + fn[:-4]] = '../assets/hud/ship/' + fn + '?v=' + hashlib.md5(open(os.path.join(sd, fn), 'rb').read()).hexdigest()[:8]
    rd = os.path.join(d, 'runes')   # the runes' marks and slot icons (Colin, AD, 2026-10-23)
    if os.path.isdir(rd):
        for fn in sorted(os.listdir(rd)):
            if fn.endswith('.png'): out['runes/' + fn[:-4]] = '../assets/hud/runes/' + fn + '?v=' + hashlib.md5(open(os.path.join(rd, fn), 'rb').read()).hexdigest()[:8]
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
    pdir = os.path.join(ROOT, 'assets', 'props')
    for sub, jn in [(d, d + '.json') for d in sorted(os.listdir(pdir)) if os.path.isfile(os.path.join(pdir, d, d + '.json'))]:   # the Art Director's set pieces, every folder of assets/props with its own json (2026-10-20: the trees, the benches, ...; 2026-10-21: any folder, so a new one such as the wreck needs no line here)
        tp = os.path.join(ROOT, 'assets', 'props', sub, jn)
        if not os.path.exists(tp): continue
        tj = json.load(open(tp, encoding='utf-8'))
        for name in tj:
            fp = os.path.join(ROOT, 'assets', 'props', sub, name + '.png'); tag = hashlib.md5(open(fp, 'rb').read()).hexdigest()[:8] if os.path.exists(fp) else '0'
            tj[name]['src'] = '../assets/props/' + sub + '/' + name + '.png?v=' + tag; tj[name]['set'] = sub; j[name] = tj[name]   # (set: its folder, for the Art Editor's set-piece browser)
    return json.dumps(j)
SRC['__PROPIMG__'] = prop_images()
def file_tag(*parts):   # the sound bundle and the music scripts carry a hash of their bytes too (2026-10-16: a browser kept the old bundle)
    fp = os.path.join(ROOT, *parts)
    return hashlib.md5(open(fp, 'rb').read()).hexdigest()[:8] if os.path.exists(fp) else '0'
SRC['__TAG_SFX__'] = file_tag('assets', 'sfx', 'combat.js')
SRC['__TAG_WSFX__'] = file_tag('assets', 'sfx', 'weather.js')   # the weather's own bundle (Derek, SD's, 2026-10-23), loaded when the first wet spell comes
SRC['__TAG_DAY__'] = file_tag('assets', 'music', 'meadow-day.js')
SRC['__TAG_NIGHT__'] = file_tag('assets', 'music', 'meadow-night.js')
SRC['__TAG_DAY_SPRING__'] = file_tag('assets', 'music', 'meadow-day-spring.js')   # the seasons' meadow by day (Derek, SD, Robin's picks of 2026-10-23: spring and winter; autumn comes)
SRC['__TAG_DAY_WINTER__'] = file_tag('assets', 'music', 'meadow-day-winter.js')
SRC['__TAG_DAY_AUTUMN__'] = file_tag('assets', 'music', 'meadow-day-autumn.js')

def portraits():
    """the talk window's and the Lore Book's pictures (Colin, AD's; docs/talk-and-lore-book.md): assets/portraits/<lore id>.png as
    { lore id: its path with a tag of its bytes }, loaded by the page when first shown, as the sheets are"""
    d = os.path.join(ROOT, 'assets', 'portraits'); out = {}
    if os.path.isdir(d):
        for fn in sorted(os.listdir(d)):
            if fn.endswith('.png') and not fn.endswith('_thumb.png'):
                out[fn[:-4]] = '../assets/portraits/' + fn + '?v=' + file_tag('assets', 'portraits', fn)
    return json.dumps(out)
SRC['__PORTRAITS__'] = portraits()

def lore_book():
    """the lore's people, beings, beasts, places and things (canon or in-game), for the talk window's name and the Lore Book:
    kind, title, norse, byname, and the book's own fields once Robin has said yes to them (book, book_more, book_more_after,
    book_facts; Alistair, LD's, 2026-10-22); never body"""
    fp = os.path.join(ROOT, 'assets', 'lore', 'lore.json')
    if not os.path.exists(fp): return '{}'
    with open(fp, encoding='utf-8') as f: L = json.load(f)
    out = {}
    for e in L.get('entries', []):
        if e.get('status') not in ('canon', 'in-game') or e.get('kind') not in ('person', 'being', 'beast', 'place', 'thing', 'family'): continue
        o = out[e['id']] = { 'kind': e['kind'], 'title': e.get('title', '') }
        for k in ('norse', 'byname', 'book', 'book_more', 'book_more_after', 'book_facts'):
            if e.get(k): o[k] = e[k]
    return json.dumps(out, ensure_ascii=False)
SRC['__LOREBOOK__'] = lore_book()

# page name in dist/  ->  template in templates/
PAGES = [
    ('index', 'index'),
    ('art-editor', 'art'),          # the Art Editor's set pieces (2026-10-21; its figures are game.html?scene=models)
    ('sea-editor', 'sea'),
    ('combat-arena', 'combat'), ('village-editor', 'village'), ('game', 'game'), ('rune-browser', 'runes'),   # the Rune Browser (2026-10-23)
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
        n = html.count(mark)
        if n > 1 and len(code) > 20000: print('!! ' + page + ': ' + mark + ' is named ' + str(n) + ' times, so its ' + str(round(len(code) / 1e6, 2)) + ' MB is pasted ' + str(n) + ' times (a comment that names a placeholder is filled too: 2026-10-22, the sprite table was in the game three times)')
        html = html.replace(mark, code)
    if '<script>' in html: html = html.replace('<script>', MUTE + '<script>', 1)
    write(os.path.join(ROOT, 'dist', page + '.html'), html)
print('built ' + ', '.join(p for p, _ in PAGES) + ' in dist/')
