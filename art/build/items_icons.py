"""Renders each thing in the hand alone, as an icon (2026-10-09): the body hidden, one kind's wood and metal parts shown, framed by
their own bounds from the same three-quarter camera, to art/render/icons/<kind>.png (128 px, transparent). tools/build.py inlines
them for the bag, the bars and the drops. The metal is the neutral grey the game tints by material.
  node tools/blender.js art/build/items_icons.py"""
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source'); OUT = os.path.abspath(os.path.join(SRC, '..', 'render', 'icons'))
KINDS = ['sword', 'axe', 'pick', 'knife', 'club', 'seax', 'spear', 'bow', 'rod']
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; vl = bpy.context.view_layer; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
body = bpy.data.collections['Body']; gear = bpy.data.collections['Gear']
toon.restyle('cel'); toon.world(sc, style='cel'); toon.sun('cel'); toon.set_scene('day')
SIZE, PX = 160, 1                                   # one pixel a unit of the render: the ink line stays thin against a long blade
toon.setup_render(sc, SIZE, PX, 16)
act = bpy.data.actions['idle']; ad = rig.animation_data; ad.action = act
if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
sc.frame_set(1); vl.update()
for o in body.objects: o.hide_render = True
os.makedirs(OUT, exist_ok=True)
for kind in KINDS:
    objs = [o for o in gear.objects if o.name.startswith(kind + 'Wood') or o.name.startswith(kind + 'Metal')]
    for o in gear.objects: o.hide_render = o not in objs; o.is_holdout = False
    if not objs: continue
    # the thing taken out of the hand and laid on its side: the forearm's +Y (its length) along world X, the blade's flat toward
    # the camera, so the icon shows the whole of it (2026-10-09; in the hanging hand it was seen end on)
    H = objs[0].matrix_world @ objs[0].matrix_basis.inverted(); Rlay = Matrix.Rotation(-math.pi / 2, 4, 'Z')
    for o in objs: mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = Rlay @ H.inverted() @ mw
    vl.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    centre = sum(pts, Vector()) / len(pts); radius = max((p - centre).length for p in pts)
    cam = toon.camera(sc, 8, radius * 2.2, 0)                        # nearly level: the flat of a blade faces the camera
    look = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1))      # the camera is placed by its rotation (no depsgraph pass yet)
    cam.location = centre - look * 10
    toon.freestyle(sc, vl, PX, gear, 'cel')
    for part in ('Wood', 'Metal'):                                     # two images per kind, the same framing: the game tints the metal by the material
        shown = [o for o in objs if o.name.startswith(kind + part)]
        if not shown: continue
        for o in objs: o.hide_render = o not in shown
        sc.render.filepath = os.path.join(OUT, kind + '_' + part.lower() + '.png'); bpy.ops.render.render(write_still=True)
    print('icon', kind, 'radius %.2f' % radius)
print('icons in', OUT)
