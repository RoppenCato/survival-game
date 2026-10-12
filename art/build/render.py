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

PARTS = {c.name[4:].lower(): c for c in bpy.data.collections if c.name.startswith('Part')}   # layers of the body itself (the people's tunic and legs, 2026-10-12): a 'Part...' collection
def base_objects(): return list(body_c.objects) + [o for c in PARTS.values() for o in c.objects]
def lines_of(objs):
    """A collection of just these objects, for the ink: the line is drawn for the layer's own meshes and for nothing that is only there to hide them."""
    c = bpy.data.collections.get('_layer') or bpy.data.collections.new('_layer')
    if c.name not in [k.name for k in sc.collection.children]: sc.collection.children.link(c)
    for o in list(c.objects): c.objects.unlink(o)
    for o in objs: c.objects.link(o)
    return c
HOLD = {"mat": None, "orig": {}}
def hold(o, on):
    """Hide what is behind this mesh without showing it: its materials are swapped for one that is a hole in the picture.
    (An object's own holdout switch does the same for the surface, but Freestyle then leaves the object out of what can hide
    a line, and every line behind a body showed through it: a beard's outline on the back of a head, the far arm through a chest.)"""
    if HOLD["mat"] is None:
        m = bpy.data.materials.new("_holdout"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial"); h = nt.nodes.new("ShaderNodeHoldout"); nt.links.new(h.outputs[0], out.inputs[0]); HOLD["mat"] = m
    o.is_holdout = False
    if o.type != "MESH": return
    if o.name not in HOLD["orig"]: HOLD["orig"][o.name] = [sl.material for sl in o.material_slots]
    for i, sl in enumerate(o.material_slots): sl.material = HOLD["mat"] if on else HOLD["orig"][o.name][i]
def layer_setup(layer):
    """Show the right meshes: the body alone, one gear piece over the body as a holdout, or 'all' (everything, for checking).
    A model with 'Part...' collections (the people): 'body' is the Body collection with the parts as holdouts, and each part
    is a layer of its own with the rest of the body as its holdout. A gear mesh may name, in its 'under' property, other gear
    that is to hide it too (a shield's face under its boss and rim)."""
    show = layer.startswith('+'); name = layer[1:] if show else layer           # '+axe': the body and that gear together, for checking (2026-10-09)
    if not show and PARTS and (name == 'body' or name in PARTS):
        col = PARTS.get(name, body_c); mine = set(o.name for o in col.objects)
        for o in base_objects(): o.hide_render = False; hold(o, o.name not in mine)
        for o in gear_c.objects: o.hide_render = True; hold(o, False)
        toon.freestyle(sc, vl, PX, col, STYLE); return
    for o in base_objects(): o.hide_render = False; hold(o, not show and layer not in ('body', 'all'))
    own = [o for o in gear_c.objects if name != 'body' and o.name.startswith(name)]
    under = set(o['under'] for o in own if o.get('under'))
    for o in gear_c.objects:
        mine = layer == 'all' or o in own; hold_it = (not mine) and not show and any(o.name.startswith(u) for u in under)
        o.hide_render = not (mine or hold_it); hold(o, hold_it)
    toon.freestyle(sc, vl, PX, body_c if layer == 'body' else (lines_of(own) if under else gear_c) if (layer != 'all' and not show) else None, STYLE)

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
    meta['anims'][anim] = {'frames': nfr, 'fps': nfr / (length / sc.render.fps), 'hands': {}}
    # the wrists per direction and frame (2026-10-09, for the things in the hands): render pixels [x, y] and the depth toward the camera, right then left
    HANDS = [b for b in ('mixamorig:RightForeArm', 'mixamorig:LeftForeArm', 'hand.R', 'hand.L') if b in rig.pose.bones]
    if rig.get('marks'): HANDS = [b for b in rig['marks'].split(',') if b in rig.pose.bones]     # a rig may name its own points (a wolf's eyes for the night glow, 2026-10-11)
    for d in range(NDIR):
        (rig.parent or rig).rotation_euler = (0, 0, -2 * math.pi * d / NDIR); rows = []
        for f in range(nfr):
            sc.frame_set(int(round(1 + f * length / nfr))); bpy.context.view_layer.update(); row = []
            for bn in HANDS[:2]:
                wp = rig.matrix_world @ rig.pose.bones[bn].tail; cv2 = world_to_camera_view(sc, cam, wp)
                row.append([round(cv2.x * SIZE * PX, 1), round((1 - cv2.y) * SIZE * PX, 1), round(cv2.z, 3)])
            rows.append(row)
        meta['anims'][anim]['hands'][dir_names[d]] = rows
    for layer in LAYERS:
        layer_setup(layer)
        for d in range(NDIR):
            (rig.parent or rig).rotation_euler = (0, 0, -2 * math.pi * d / NDIR)      # a Mixamo rig sits under a 'Turn' empty (mixamo_bind.py)
            for f in range(nfr):
                sc.frame_set(int(round(1 + f * length / nfr)))
                sc.render.filepath = os.path.join(out, '%s_%s_%s_%02d.png' % (anim, layer, dir_names[d], f))
                if not (opt.get('keep') == '1' and os.path.exists(sc.render.filepath)): bpy.ops.render.render(write_still=True)   # --keep 1: a frame already on disk is left as it is (re-render one clip by deleting its frames; the numbers are written for every clip named)
                n += 1
with open(os.path.join(out, opt.get('meta', 'meta.json')), 'w') as fh: json.dump(meta, fh, indent=1)   # --meta name.json: several renders into one folder at once each keep their own numbers (tools/peoplerender.js joins them)
print('rendered', n, 'frames to', out, 'anchor', anchor, 'figure px', round(meta['figure_px'], 1))
