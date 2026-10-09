"""Checks the packed face images of hero2.blend: channels, alpha mode, a few pixels (2026-10-09)."""
import bpy, sys
bpy.ops.wm.open_mainfile(filepath=sys.argv[sys.argv.index('--') + 1])
for nm in ('face_dot_neutral', 'face_dot_angry'):
    im = bpy.data.images.get(nm)
    if not im: print(nm, 'MISSING'); continue
    px = im.pixels[:]; w = im.size[0]
    def at(u, v): i = (int(v * w) * w + int(u * w)) * 4; return tuple(round(x, 2) for x in px[i:i + 4])
    print(nm, 'size', tuple(im.size), 'channels', im.channels, 'alpha', im.alpha_mode, 'packed', im.packed_file is not None, 'source', im.source,
          'centre', at(0.5, 0.5), 'eyeL', at(0.5 - 0.19, 0.575), 'brow', at(0.5 - 0.19, 0.66), 'nonzero alpha px', sum(1 for i in range(3, len(px), 4) if px[i] > 0.01))
m = bpy.data.materials['face']; print('face material props', dict(m.items()))
