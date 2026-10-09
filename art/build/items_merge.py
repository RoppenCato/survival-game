"""Merges the item-layer renders (items_a, items_b, items_c) into art/render/hero2_mixamo: the frames copied in, meta.json's layers
extended and every animation's hands taken from the item renders (the body render predates the hands export)."""
import os, json, shutil, glob
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
dst = 'art/render/hero2_mixamo'; m0 = json.load(open(os.path.join(dst, 'meta.json')))
n = 0
for src in ['art/render/items_a', 'art/render/items_b', 'art/render/items_c']:
    mp = os.path.join(src, 'meta.json')
    if not os.path.exists(mp): print('missing', mp); continue
    m1 = json.load(open(mp))
    assert m1['anchor'] == m0['anchor'], (src, m1['anchor'], m0['anchor'])
    for L in m1['layers']:
        if L not in m0['layers']: m0['layers'].append(L)
    for a, A in m1['anims'].items():
        assert a in m0['anims'] and m0['anims'][a]['frames'] == A['frames'], (src, a)
        if 'hands' in A: m0['anims'][a]['hands'] = A['hands']
    for f in glob.glob(os.path.join(src, '*.png')): shutil.copy(f, dst); n += 1
json.dump(m0, open(os.path.join(dst, 'meta.json'), 'w'), indent=1)
print('copied', n, 'frames; layers', m0['layers']); print('hands on', [a for a in m0['anims'] if 'hands' in m0['anims'][a]])
