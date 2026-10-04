#!/usr/bin/env python3
"""Build the playable test pages from the source files.

Usage:  python3 tools/build.py
Output in dist/: index.html (the start page), the editors (character-editor, creature-editor,
object-editor, environment-editor, base-editor, sea-editor), the playable pages (combat-arena, world-prototype) and three older
experiments (style-lab, style-test, walk-test). Each is a single self-contained file.
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

art = read('src', 'art.js')
combat = read('src', 'combat.js')

write(os.path.join(ROOT, 'dist', 'combat-arena.html'),
      read('templates', 'combat.html').replace('__ART__', art).replace('__COMBAT__', combat))
write(os.path.join(ROOT, 'dist', 'style-test.html'),
      read('templates', 'style.html').replace('__ART__', art))
lab = read('src', 'stylelab.js')
write(os.path.join(ROOT, 'dist', 'style-lab.html'),
      read('templates', 'stylelab.html').replace('__LIB__', art + '\n' + lab))
walk = read('src', 'walk.js')
write(os.path.join(ROOT, 'dist', 'walk-test.html'),
      read('templates', 'walk.html').replace('__ART__', art).replace('__LIB__', lab).replace('__WALK__', walk))
zw = read('src', 'zoneworld.js')
write(os.path.join(ROOT, 'dist', 'world-prototype.html'),
      read('templates', 'zones.html').replace('__ART__', art).replace('__LIB__', lab).replace('__ZW__', zw))
write(os.path.join(ROOT, 'dist', 'character-editor.html'),
      read('templates', 'sprite.html').replace('__ART__', art).replace('__COMBAT__', combat))
write(os.path.join(ROOT, 'dist', 'object-editor.html'),
      read('templates', 'objects.html').replace('__ART__', art).replace('__LIB__', lab).replace('__COMBAT__', combat))
write(os.path.join(ROOT, 'dist', 'creature-editor.html'),
      read('templates', 'creature.html').replace('__ART__', art).replace('__COMBAT__', combat))
write(os.path.join(ROOT, 'dist', 'environment-editor.html'),
      read('templates', 'environment.html').replace('__ART__', art).replace('__LIB__', lab).replace('__COMBAT__', combat))
write(os.path.join(ROOT, 'dist', 'base-editor.html'),
      read('templates', 'base.html').replace('__ART__', art).replace('__LIB__', lab).replace('__COMBAT__', combat))
write(os.path.join(ROOT, 'dist', 'sea-editor.html'),
      read('templates', 'sea.html').replace('__ART__', art).replace('__LIB__', lab).replace('__COMBAT__', combat))
write(os.path.join(ROOT, 'dist', 'index.html'), read('templates', 'index.html'))
print('built index, character-editor, creature-editor, object-editor, environment-editor, base-editor, sea-editor, combat-arena, world-prototype, style-lab, style-test and walk-test in dist/')
