#!/usr/bin/env python3
"""Build the playable test pages from the source files.

Usage:  python3 tools/build.py
Output: dist/combat-test.html and dist/style-test.html (each is a single
self-contained file you can open in a browser or host anywhere).
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

art = read('src', 'art.js')
combat = read('src', 'combat.js')

write(os.path.join(ROOT, 'dist', 'combat-test.html'),
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
write(os.path.join(ROOT, 'dist', 'zone-world.html'),
      read('templates', 'zones.html').replace('__ART__', art).replace('__LIB__', lab).replace('__ZW__', zw))
print('built combat-test, style-test, style-lab, walk-test and zone-world in dist/')
