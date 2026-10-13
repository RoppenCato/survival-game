"""The hero's shield, and the clip that raises it (2026-10-13, Robin: "you need to create a shield and implement it").
Opens art/source/hero2_mixamo.blend, removes any earlier shield, and builds a Viking round shield on the left forearm as
three layers for render.py (each is a hole under the others, o['under'] = 'shield', so the game can stack them):

  shieldRim   what is never coloured: the boards' back, the rawhide rim, the iron boss and its flange, the seams between
              the boards
  shieldFace  the face, near white: the game multiplies a colour in (bare limewood, or the paint)
  shieldMark  the device of a painted shield: two opposite quarters, near white, for a second colour

The shield lies on the back of the forearm (up, in the T-pose), its middle a little toward the wrist of the forearm's
middle, as the people's does (people_build.py); it is the size of theirs (0.31 m against 0.315).

Two clips are made. 'block': the left arm bringing the shield across the body from the idle's stance (the bones are aimed at
directions in the world, as in people_build.py). Twelve frames: the arm is across by the ninth. 'block_walk': the walk's own
frames with the left arm held across (a man with his shield up walks at half his pace; in the idle's stance he slid).

  node tools/blender.js art/build/shield_build.py"""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE'); gear = bpy.data.collections['Gear']
for o in list(gear.objects):
    if o.name.startswith('shield'): bpy.data.objects.remove(o)

COL = {'s_wood': '#8a5f3c', 's_seam': '#553a25', 's_hide': '#4f3b2a', 's_iron': '#aab0b8', 's_irondark': '#7c838c', 's_face': '#efefef', 's_mark': '#efefef'}
M = {k: toon.material(k, v, None, 'cel') for k, v in COL.items()}
BONE = 'mixamorig:LeftForeArm'

def obj(name, bm, mat, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); gear.objects.link(o)
    vg = o.vertex_groups.new(name=BONE); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    md = o.modifiers.new('Rig', 'ARMATURE'); md.object = rig
    o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
    o.hide_render = True; o['under'] = 'shield'
    return o
def disc(name, mat, c, r, z0, z1, seg=24):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=z1 - z0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((c[0], c[1], (z0 + z1) / 2)), verts=bm.verts); return obj(name, bm, mat)
def sector(name, mat, c, r, a0, a1, z0, z1, seg=8):
    """a slice of a disc between two angles (a quarter of the face)"""
    bm = bmesh.new(); lo, hi = [bm.verts.new((c[0], c[1], z0))], [bm.verts.new((c[0], c[1], z1))]
    for i in range(seg + 1):
        a = a0 + (a1 - a0) * i / seg; x, y = c[0] + math.cos(a) * r, c[1] + math.sin(a) * r
        lo.append(bm.verts.new((x, y, z0))); hi.append(bm.verts.new((x, y, z1)))
    for i in range(1, seg + 1):
        bm.faces.new((hi[0], hi[i], hi[i + 1])); bm.faces.new((lo[0], lo[i + 1], lo[i])); bm.faces.new((lo[i], lo[i + 1], hi[i + 1], hi[i]))
    bm.faces.new((lo[0], lo[1], hi[1], hi[0])); bm.faces.new((lo[seg + 1], lo[0], hi[0], hi[seg + 1]))
    return obj(name, bm, mat)
def box(name, mat, c, size):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts); return obj(name, bm, mat)
def dome(name, mat, c, r, sz):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=r)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((1.0, 1.0, sz, 1.0)), verts=bm.verts); return obj(name, bm, mat, True)

# ---- the shield, in the T-pose: the forearm runs along +X, its back is up ----
fa0 = rig.matrix_world @ rig.data.bones[BONE].head_local; fa1 = rig.matrix_world @ rig.data.bones[BONE].tail_local
cx, cy, z = (fa0.x + fa1.x) / 2 + 0.02, (fa0.y + fa1.y) / 2, fa0.z
R = 0.31
disc('shieldRim_back', M['s_wood'], (cx, cy), R, z + 0.066, z + 0.090)                    # the boards, seen from behind and at the edge
disc('shieldRim_edge', M['s_hide'], (cx, cy), R + 0.009, z + 0.062, z + 0.0965)           # the rawhide bound round the rim
disc('shieldFace_d', M['s_face'], (cx, cy), R - 0.030, z + 0.088, z + 0.1020)             # the face
for k, (a0, a1) in enumerate(((math.pi * 0.25, math.pi * 0.75), (math.pi * 1.25, math.pi * 1.75))):   # the device: two quarters, toward the elbow's side and away
    sector('shieldMark_q%d' % k, M['s_mark'], (cx, cy), R - 0.034, a0, a1, z + 0.1005, z + 0.1045)
for k, dy in enumerate((-0.165, -0.055, 0.055, 0.165)):                                   # the seams between five boards, running along the forearm
    half = math.sqrt(max(0.0, (R - 0.034) ** 2 - dy * dy))
    box('shieldRim_seam%d' % k, M['s_seam'], (cx, cy + dy, z + 0.1035), (2 * half, 0.009, 0.0045))
disc('shieldRim_flange', M['s_irondark'], (cx, cy), 0.092, z + 0.1005, z + 0.109, 16)     # the boss's flange, nailed to the boards
dome('shieldRim_boss', M['s_iron'], (cx, cy, z + 0.108), 0.07, 0.72)                      # the boss over the hand

# ---- the clip: the shield brought across (block) ----
def set_action(name):
    act = bpy.data.actions[name]; ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
if 'block' in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions['block'])
set_action('idle'); sc.frame_set(1); bpy.context.view_layer.update()
BASE = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.rotation_mode) for pb in rig.pose.bones}
act = bpy.data.actions.new('block'); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = 12
ad = rig.animation_data; ad.action = act
def key_all(frame):
    for pb in rig.pose.bones:
        pb.keyframe_insert('location', frame=frame)
        pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=frame)
def to_base():
    for pb in rig.pose.bones:
        loc, q, e, mode = BASE[pb.name]; pb.location = loc
        if mode == 'QUATERNION': pb.rotation_quaternion = q
        else: pb.rotation_euler = e
    bpy.context.view_layer.update()
def aim(bn, d, up_local=None, up_world=None):
    """Turn a bone so that it points along d (in the world); with up_local and up_world, also about itself so that its own
    up_local looks as nearly toward up_world as it can."""
    pb = rig.pose.bones[bn]; Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation(); Rm = Mw.to_3x3().normalized(); d = Vector(d).normalized()
    cur = (Rm @ Vector((0, 1, 0))).normalized(); R2 = cur.rotation_difference(d).to_matrix() @ Rm
    if up_local is not None:
        a = R2 @ Vector(up_local); a = (a - a.dot(d) * d).normalized(); b = Vector(up_world); b = (b - b.dot(d) * d).normalized()
        ang = a.angle(b); sign = 1.0 if d.dot(a.cross(b)) > 0 else -1.0; R2 = Matrix.Rotation(sign * ang, 3, d) @ R2
    M2 = R2.to_4x4(); M2.translation = loc; pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
fb = rig.data.bones[BONE]
DORSAL = (rig.matrix_world @ fb.matrix_local).to_3x3().normalized().inverted() @ Vector((0, 0, 1))      # the back of the forearm, where the shield lies: up, in the T-pose
def block_pose(k):                                       # k: 0 the idle's stance .. 1 the shield across
    to_base()
    if k <= 0: return
    pb = rig.pose.bones['mixamorig:LeftArm']; cur = ((rig.matrix_world @ pb.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
    aim('mixamorig:LeftArm', cur.lerp(Vector((-0.12, -0.62, -0.78)).normalized(), k))
    pf = rig.pose.bones['mixamorig:LeftForeArm']; curf = ((rig.matrix_world @ pf.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
    aim('mixamorig:LeftForeArm', curf.lerp(Vector((-0.8, -0.32, 0.5)).normalized(), k), DORSAL, Vector((0.12, -1.0, 0.22)))
for f, k in ((1, 0.0), (3, 0.4), (5, 0.72), (7, 0.92), (9, 1.0), (12, 1.0)):
    block_pose(k); key_all(f)
if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]

# ---- the walk with the shield up: the walk's own frames, the left arm held across ----
if 'block_walk' in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions['block_walk'])
walk = bpy.data.actions['walk']; bw = walk.copy(); bw.name = 'block_walk'; bw.use_fake_user = True
set_action('block_walk'); w0, w1 = int(round(walk.frame_range[0])), int(round(walk.frame_range[1]))
A_DIR, F_DIR, UP = Vector((-0.12, -0.62, -0.78)).normalized(), Vector((-0.8, -0.32, 0.5)).normalized(), Vector((0.12, -1.0, 0.22))
for f in range(w0, w1 + 1):
    sc.frame_set(f); bpy.context.view_layer.update()
    aim('mixamorig:LeftArm', A_DIR); aim('mixamorig:LeftForeArm', F_DIR, DORSAL, UP)
    for bn in ('mixamorig:LeftArm', 'mixamorig:LeftForeArm'):
        pb = rig.pose.bones[bn]; pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=f)

set_action('idle'); sc.frame_set(1)
out = os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')); bpy.ops.wm.save_as_mainfile(filepath=out)
print('shield built:', sorted(o.name for o in gear.objects if o.name.startswith('shield')), '; clip block', act.frame_start, 'to', act.frame_end, '; block_walk', w0, 'to', w1, '; saved', out)
