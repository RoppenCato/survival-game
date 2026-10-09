#!/usr/bin/env python3
"""Build the pages from the source files.

Usage:  python3 tools/build.py
Output in dist/: index.html (the start page), the editors (art-editor, sea-editor, song-editor,
village-editor), the combat-arena and the game.
Each is a single self-contained file you can open in a browser or host anywhere.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)

SRC = {'__ART__': read('src', 'art.js'), '__LIB__': read('src', 'stylelab.js'), '__WORLD__': read('src', 'world.js'), '__BUILD__': read('src', 'build.js'), '__ITEMS__': read('src', 'items.js'), '__RUNES__': read('src', 'runes.js'), '__HIRD__': read('src', 'hird.js'), '__YARD__': read('src', 'yard.js'), '__VILLAGE__': read('src', 'village.js'), '__GATHER__': read('src', 'gather.js'), '__FISHING__': read('src', 'fishing.js'), '__MUSIC__': read('src', 'music.js'), '__SPRITES_JS__': read('src', 'sprites.js'), '__COMBAT__': read('src', 'combat.js')}

# The Blender hero's sprite sheets (assets/sprites/hero, 2026-10-09): the Character Editor and the Blender Editor get each sheet's
# metadata inlined and the PNGs as paths beside dist/ (../assets/sprites/...), which load from file:// and from the workbench
# server rooted at the repo. (They were data URIs until 2026-10-09; eighteen Mixamo clips made that 25 MB of page.)
import base64, json, re
def all_sprites():
    """every packed sheet under assets/sprites/<name>/<name>.json, for the Blender Editor"""
    root = os.path.join(ROOT, 'assets', 'sprites'); out = {}
    if not os.path.isdir(root): return 'null'
    for name in sorted(os.listdir(root)):
        jp = os.path.join(root, name, name + '.json')
        if not os.path.exists(jp): continue
        j = json.load(open(jp, encoding='utf-8')); imgs = {}
        for a in j['anims'].values():
            for f in a['sheets'].values(): imgs[f] = '../assets/sprites/' + name + '/' + f
        out[name] = {'meta': j, 'images': imgs}
    return json.dumps(out)
SRC['__SPRITES__'] = all_sprites()
def item_icons():
    """the things in the hand as icons (art/build/items_icons.py), assets/sprites/items/<kind>_wood.png and _metal.png"""
    d = os.path.join(ROOT, 'assets', 'sprites', 'items'); out = {}
    if not os.path.isdir(d): return 'null'
    for fn in sorted(os.listdir(d)):
        m = re.match(r'^(\w+?)_(wood|metal)\.png$', fn)
        if m: out.setdefault(m.group(1), {})[m.group(2)] = '../assets/sprites/items/' + fn
    return json.dumps(out)
SRC['__ICONS__'] = item_icons()

# page name in dist/  ->  template in templates/
PAGES = [
    ('index', 'index'),
    ('art-editor', 'art'),          # the Character, Creature, Object and Blender editors as one page (2026-10-09, the cleanup)
    ('sea-editor', 'sea'),
    ('song-editor', 'song'),
    ('combat-arena', 'combat'), ('village-editor', 'village'), ('game', 'game'),
]
for page, template in PAGES:
    html = read('templates', template + '.html')
    for mark, code in SRC.items():
        html = html.replace(mark, code)
    write(os.path.join(ROOT, 'dist', page + '.html'), html)
print('built ' + ', '.join(p for p, _ in PAGES) + ' in dist/')
