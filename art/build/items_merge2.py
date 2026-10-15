"""Merges named item-layer render folders into art/render/hero2_mixamo (2026-10-15): the frames copied in over what is there,
meta.json's layers extended and the hands of every animation taken from the item renders. Like items_merge.py, but the folders
are named on the command line, so a re-render of a few layers for a few clips (the axe in the slashes, the long weapons carried)
joins the set without touching the rest.   python art/build/items_merge2.py art/render/hand_axe2 art/render/carry_a ..."""
import os, json, shutil, glob, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
dst = 'art/render/hero2_mixamo'; m0 = json.load(open(os.path.join(dst, 'meta.json')))
n = 0
for src in sys.argv[1:]:
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
print('copied', n, 'frames from', len(sys.argv) - 1, 'folders; layers', len(m0['layers']))
