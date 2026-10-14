"""A weapon rack (2026-10-14; Robin: how are we doing with weapons?): each thing in the hand rendered alone and large, laid at a
slant so the flat of a blade and the beard of an axe face the camera, framed tight by its own projected bounds. Two images a
kind, the same framing: <kind>_wood.png and <kind>_metal.png (the metal in the neutral grey the game tints by material), to
<out>/. Also the way the bag's icons should be cut: a thing framed by its own slanted bounds fills its square instead of lying
as a sliver along the diagonal (items_icons.py framed by the bounding sphere and showed a blade eight pixels wide).
  node tools/blender.js art/build/rack.py -- <blend> <out dir> [size]"""
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
argv = sys.argv[sys.argv.index('--') + 1:]; blend, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1]); SIZE = int(argv[2]) if len(argv) > 2 else 400
KINDS = ['sword', 'axe', 'greataxe', 'seax', 'knife', 'spear', 'club', 'pick', 'bow']
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; vl = bpy.context.view_layer; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
body = bpy.data.collections['Body']; gear = bpy.data.collections['Gear']
toon.restyle('cel'); toon.world(sc, style='cel'); toon.sun('cel'); toon.set_scene('day')
PX = 1; toon.setup_render(sc, SIZE, PX, 16)
act = bpy.data.actions['idle']; ad = rig.animation_data; ad.action = act
if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
sc.frame_set(1); vl.update()
for o in body.objects: o.hide_render = True
for c in bpy.data.collections:
    if c.name.startswith('Part'):
        for o in c.objects: o.hide_render = True
os.makedirs(OUT, exist_ok=True)
ELEV, SLANT = 28, -38                                   # the camera a little above the rack, the thing turned so its flat faces the camera at a slant
for kind in KINDS:
    objs = [o for o in gear.objects if o.name.startswith(kind + 'Wood') or o.name.startswith(kind + 'Metal')]
    for o in gear.objects: o.hide_render = o not in objs; o.is_holdout = False
    if not objs: print('no', kind); continue
    # out of the hand, laid along world X with the blade's flat up, then turned by the slant about Z
    H = objs[0].matrix_world @ objs[0].matrix_basis.inverted(); Rlay = Matrix.Rotation(math.radians(SLANT), 4, 'Z') @ Matrix.Rotation(-math.pi / 2, 4, 'Z')
    for o in objs: mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = Rlay @ H.inverted() @ mw
    vl.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]; centre = sum(pts, Vector()) / len(pts); radius = max((p - centre).length for p in pts)
    cam = toon.camera(sc, ELEV, radius * 2.2, 0); look = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1)); cam.location = centre - look * 10; vl.update()
    # the framing from the projected bounds: fit the longer side, centre it
    uv = [world_to_camera_view(sc, cam, p) for p in pts]; u0, u1 = min(p.x for p in uv), max(p.x for p in uv); v0, v1 = min(p.y for p in uv), max(p.y for p in uv)
    span = max(u1 - u0, v1 - v0) * radius * 2.2 * 1.12; cam.data.ortho_scale = span
    right = cam.rotation_euler.to_matrix() @ Vector((1, 0, 0)); up = cam.rotation_euler.to_matrix() @ Vector((0, 1, 0))
    cam.location += right * ((u0 + u1) / 2 - 0.5) * radius * 2.2 + up * ((v0 + v1) / 2 - 0.5) * radius * 2.2; vl.update()
    toon.freestyle(sc, vl, PX, gear, 'cel')
    for part in ('Wood', 'Metal'):
        shown = [o for o in objs if o.name.startswith(kind + part)]
        if not shown: continue
        for o in objs: o.hide_render = o not in shown
        sc.render.filepath = os.path.join(OUT, kind + '_' + part.lower() + '.png'); bpy.ops.render.render(write_still=True)
    print('rack', kind, 'span %.2f' % span)
print('rack in', OUT)
