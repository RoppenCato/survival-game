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

SRC = {'__ART__': read('src', 'art.js'), '__LIB__': read('src', 'stylelab.js'), '__WORLD__': read('src', 'world.js'), '__BUILD__': read('src', 'build.js'), '__ITEMS__': read('src', 'items.js'), '__RUNES__': read('src', 'runes.js'), '__HIRD__': read('src', 'hird.js'), '__YARD__': read('src', 'yard.js'), '__GATHER__': read('src', 'gather.js'), '__MUSIC__': read('src', 'music.js'), '__COMBAT__': read('src', 'combat.js')}

# page name in dist/  ->  template in templates/
PAGES = [
    ('index', 'index'),
    ('character-editor', 'sprite'),
    ('creature-editor', 'creature'),
    ('object-editor', 'objects'),
    ('sea-editor', 'sea'),
    ('hird-editor', 'hird'),
    ('item-editor', 'items'),
    ('song-editor', 'song'),
    ('combat-arena', 'combat'), ('gathering-editor', 'gather'), ('look-editor', 'look'), ('game', 'game'),
]
for page, template in PAGES:
    html = read('templates', template + '.html')
    for mark, code in SRC.items():
        html = html.replace(mark, code)
    write(os.path.join(ROOT, 'dist', page + '.html'), html)
print('built ' + ', '.join(p for p, _ in PAGES) + ' in dist/')
