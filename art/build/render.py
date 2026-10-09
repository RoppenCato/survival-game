"""Renders a rigged character from its .blend to frames (2026-10-09): every animation, every direction, every layer, as
transparent PNGs at double size for tools/sprites.js to crop, halve and pack. The camera, the sun, the toon look and the ink
line come from toon.py, so every character renders alike.

  node tools/blender.js art/build/render.py -- art/source/hero.blend art/render/hero [--anims idle,walk] [--dirs 8]
      [--frames 8 | --frames idle=16,walk=12,8] [--walkframes 6] [--layers body,helm,mail] [--size 160] [--px 2] [--elev 35] [--ortho 1.75] [--style cel|painted|folk] [--eyes dot|oval|highlight] [--face neutral|blink|angry|hurt] [--scene day|night]

The frame is size by size at 1x (px times that in the render); the figure's origin (between the feet) projects to the pixel
written in meta.json as the foot anchor. A layer is 'body' (the Body collection alone) or the name of a gear piece: its meshes
(names starting with that word) over the body as a holdout, so what the body hides stays hidden and the game can stack the
layers. Directions go clockwise from facing the camera: s, sw, w, nw, n, ne, e, se."""
import bpy, math, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
blend, out = os.path.abspath(argv[0]), os.path.abspath(argv[1])
opt = {'anims': 'idle,walk', 'dirs': '8', 'frames': '8', 'layers': 'body,helm,mail', 'size': '160', 'px': '2', 'elev': '35', 'ortho': '1.75', 'samples': '16', 'style': 'cel', 'walkframes': '', 'face': 'neutral', 'eyes': 'dot', 'scene': 'day'}
i = 2
while i < len(argv):
    k = argv[i].lstrip('-'); opt[k] = argv[i + 1]; i += 2
ANIMS = opt['anims'].split(','); NDIR = int(opt['dirs']); LAYERS = opt['layers'].split(',')
# --frames is one number for every animation, or per-animation counts 'idle=16,walk=12' with a plain number as the default
FR = {}; NFR = 8
for part in opt['frames'].split(','):
    if '=' in part: k, v = part.split('='); FR[k.strip()] = int(v)
    elif part.strip(): NFR = int(part)
SIZE, PX = int(opt['size']), int(opt['px'])
DIRS8 = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']
dir_names = DIRS8 if NDIR == 8 else ['s', 'w', 'n', 'e'] if NDIR == 4 else [('d%d' % d) for d in range(NDIR)]
STYLE = opt['style']; toon.FACE = opt['face']; toon.EYES = opt['eyes']; toon.set_scene(opt['scene'])

bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; vl = bpy.context.view_layer
rig = next(o for o in sc.objects if o.type == 'ARMATURE')
body_c = bpy.data.collections['Body']; gear_c = bpy.data.collections['Gear']
toon.restyle(STYLE); toon.world(sc, style=STYLE); toon.sun(STYLE); cam = toon.camera(sc, float(opt['elev']), float(opt['ortho']))
toon.setup_render(sc, SIZE, PX, int(opt['samples']))

def layer_setup(layer):
    """Show the right meshes: the body alone, one gear piece over the body as a holdout, or 'all' (everything, for checking)."""
    for o in body_c.objects: o.hide_render = False; o.is_holdout = layer not in ('body', 'all')
    for o in gear_c.objects: o.hide_render = not (layer == 'all' or (layer != 'body' and o.name.startswith(layer))); o.is_holdout = False
    toon.freestyle(sc, vl, PX, body_c if layer == 'body' else gear_c if layer != 'all' else None, STYLE)

def set_action(name):
    act = bpy.data.actions[name]; ad = rig.animation_data; ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act

# the foot anchor: where the origin lands in the render
bpy.context.view_layer.update()
a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
anchor = {'x': a.x * SIZE * PX, 'y': (1 - a.y) * SIZE * PX}
top = world_to_camera_view(sc, cam, Vector((0, 0, 1.8)))
meta = {'style': STYLE, 'scene': toon.SCENE, 'face': toon.FACE, 'eyes': toon.EYES, 'size': SIZE, 'px': PX, 'anchor': anchor, 'dirs': dir_names, 'frames': NFR, 'anims': {}, 'layers': LAYERS,
        'figure_px': (top.y - a.y) * SIZE * PX, 'elev': float(opt['elev']), 'ortho': float(opt['ortho'])}
os.makedirs(out, exist_ok=True)
n = 0
for anim in ANIMS:
    act = set_action(anim); length = int(act.frame_end - act.frame_start + 1) if act.use_frame_range else int(act.frame_range[1] - act.frame_range[0] + 1)
    nfr = FR.get(anim, int(opt['walkframes']) if (anim == 'walk' and opt['walkframes']) else NFR)
    meta['anims'][anim] = {'frames': nfr, 'fps': nfr / (length / sc.render.fps)}
    for layer in LAYERS:
        layer_setup(layer)
        for d in range(NDIR):
            (rig.parent or rig).rotation_euler = (0, 0, -2 * math.pi * d / NDIR)      # a Mixamo rig sits under a 'Turn' empty (mixamo_bind.py)
            for f in range(nfr):
                sc.frame_set(int(round(1 + f * length / nfr)))
                sc.render.filepath = os.path.join(out, '%s_%s_%s_%02d.png' % (anim, layer, dir_names[d], f))
                bpy.ops.render.render(write_still=True); n += 1
with open(os.path.join(out, 'meta.json'), 'w') as fh: json.dump(meta, fh, indent=1)
print('rendered', n, 'frames to', out, 'anchor', anchor, 'figure px', round(meta['figure_px'], 1))
