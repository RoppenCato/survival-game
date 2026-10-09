#!/usr/bin/env python3
"""Build the pages from the source files.

Usage:  python3 tools/build.py
Output in dist/: index.html (the start page), the editors (character-editor, creature-editor,
object-editor, sea-editor, hird-editor) and the playable combat-arena.
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

SRC = {'__ART__': read('src', 'art.js'), '__LIB__': read('src', 'stylelab.js'), '__WORLD__': read('src', 'world.js'), '__BUILD__': read('src', 'build.js'), '__ITEMS__': read('src', 'items.js'), '__RUNES__': read('src', 'runes.js'), '__HIRD__': read('src', 'hird.js'), '__YARD__': read('src', 'yard.js'), '__VILLAGE__': read('src', 'village.js'), '__GATHER__': read('src', 'gather.js'), '__FISHING__': read('src', 'fishing.js'), '__MUSIC__': read('src', 'music.js'), '__COMBAT__': read('src', 'combat.js')}

# The Blender hero's sprite sheets (assets/sprites/hero, 2026-10-09) inlined into the Character Editor as data URIs, so the
# single-file page can show them when opened from disk. Nothing else reads them yet.
import base64, json
def hero_sprites():
    d = os.path.join(ROOT, 'assets', 'sprites', 'hero')
    if not os.path.exists(os.path.join(d, 'hero.json')): return 'null'
    j = json.load(open(os.path.join(d, 'hero.json'), encoding='utf-8')); imgs = {}
    for a in j['anims'].values():
        for f in a['sheets'].values():
            with open(os.path.join(d, f), 'rb') as fh: imgs[f] = 'data:image/png;base64,' + base64.b64encode(fh.read()).decode('ascii')
    return json.dumps({'meta': j, 'images': imgs})
SRC['__HERO_SPRITES__'] = hero_sprites()
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
                with open(os.path.join(root, name, f), 'rb') as fh: imgs[f] = 'data:image/png;base64,' + base64.b64encode(fh.read()).decode('ascii')
        out[name] = {'meta': j, 'images': imgs}
    return json.dumps(out)
SRC['__SPRITES__'] = all_sprites()

# page name in dist/  ->  template in templates/
PAGES = [
    ('index', 'index'),
    ('character-editor', 'sprite'),
    ('blender-editor', 'blender'),
    ('creature-editor', 'creature'),
    ('object-editor', 'objects'),
    ('sea-editor', 'sea'),
    ('hird-editor', 'hird'),
    ('item-editor', 'items'),
    ('song-editor', 'song'),
    ('combat-arena', 'combat'), ('gathering-editor', 'gather'), ('look-editor', 'look'), ('light-editor', 'light'), ('village-editor', 'village'), ('game', 'game'),
]
for page, template in PAGES:
    html = read('templates', template + '.html')
    for mark, code in SRC.items():
        html = html.replace(mark, code)
    write(os.path.join(ROOT, 'dist', page + '.html'), html)
print('built ' + ', '.join(p for p, _ in PAGES) + ' in dist/')
