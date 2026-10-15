"""The spear's blow: a thrust, keyed by script on the hero's rig (2026-10-15; Robin: "he should be doing a stabbing motion
with the spear, not swing"). The rig has no stab from Mixamo, so the clip is made the way the shield's block was
(shield_build.py): from the idle's stance, bones aimed at directions in the world and every bone keyed per frame. Twelve
frames: the right arm drawn back and the spear levelled (1 to 4), the lunge with the torso leaning in and the arm driven out
straight (5 to 7, the point furthest at 7), the hold (8), and the recovery to the stance (9 to 12). The left arm, shield or
not, stays as the idle has it. The spear is along the forearm as in every fight clip, so the spear's own layers render on
this clip from hero2_mixamo.blend like the rest. At full reach the point is 1.7 m ahead of him, which the set's frame cuts;
the clip is rendered in a frame of its own (render.py --size 280 --ortho 3.535), as the death is.
   node tools/blender.js art/build/thrust_build.py        (opens art/source/hero2_mixamo.blend, adds the clip, saves it)"""
import bpy, math, os, sys
from mathutils import Vector, Matrix
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
def set_action(name):
    act = bpy.data.actions[name]; ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
if 'thrust' in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions['thrust'])
set_action('idle'); sc.frame_set(1); bpy.context.view_layer.update()
BASE = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.rotation_mode) for pb in rig.pose.bones}
act = bpy.data.actions.new('thrust'); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = 12
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
    up_local looks as nearly toward up_world as it can (shield_build.py's)."""
    pb = rig.pose.bones[bn]; Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation(); Rm = Mw.to_3x3().normalized(); d = Vector(d).normalized()
    cur = (Rm @ Vector((0, 1, 0))).normalized(); R2 = cur.rotation_difference(d).to_matrix() @ Rm
    if up_local is not None:
        a = R2 @ Vector(up_local); a = (a - a.dot(d) * d).normalized(); b = Vector(up_world); b = (b - b.dot(d) * d).normalized()
        ang = a.angle(b); sign = 1.0 if d.dot(a.cross(b)) > 0 else -1.0; R2 = Matrix.Rotation(sign * ang, 3, d) @ R2
    M2 = R2.to_4x4(); M2.translation = loc; pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
def cur_dir(bn):
    pb = rig.pose.bones[bn]; return ((rig.matrix_world @ pb.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
# the hero faces -Y; his right is -X; up is +Z. The forearm's knuckles (its local +Z) are kept up, so the spear's blade stands on edge
UP = Vector((0, 0, 1)); KN = (0, 0, 1)
COCK_ARM, COCK_FORE = Vector((-0.35, 0.55, 0.75)).normalized(), Vector((0.10, -0.80, -0.58)).normalized()       # overhand: the elbow high and behind the shoulder, the forearm forward and down from the ear, the spear aimed down at the target
HIT_ARM, HIT_FORE = Vector((-0.10, -0.85, -0.52)).normalized(), Vector((0.05, -0.90, -0.43)).normalized()      # the arm driven out straight, forward and down: the point 1.5 m ahead at belly height
def lerp(a, b, k): return (a * (1 - k) + b * k).normalized()
def pose(k_cock, k_hit, lean):
    """k_cock 0..1 draws the arm back from the stance; k_hit 0..1 drives it out from the cocked pose; lean tilts the torso in"""
    to_base()
    a0, f0 = cur_dir('mixamorig:RightArm'), cur_dir('mixamorig:RightForeArm')
    if lean:
        for bn, amt in (('mixamorig:Spine', 0.7), ('mixamorig:Spine1', 0.45), ('mixamorig:Spine2', 0.3)):
            d = cur_dir(bn); aim(bn, lerp(d, Vector((0, -1, 0.8)).normalized(), lean * amt))
        hips = rig.pose.bones['mixamorig:Hips']; hips.location = BASE[hips.name][0] + (rig.matrix_world.inverted().to_3x3() @ Vector((0, -0.12, 0))) * lean / max(1e-6, rig.scale.x if False else 1.0)   # the lunge: the hips carried forward (the rig's own scale is in the bone space, hence the inverse)
        bpy.context.view_layer.update()
    a = lerp(lerp(a0, COCK_ARM, k_cock), HIT_ARM, k_hit); f = lerp(lerp(f0, COCK_FORE, k_cock), HIT_FORE, k_hit)
    if k_cock > 0 or k_hit > 0:
        aim('mixamorig:RightArm', a); aim('mixamorig:RightForeArm', f, KN, UP)
for fr, kc, kh, ln in ((1, 0.0, 0.0, 0.0), (2, 0.6, 0.0, 0.0), (3, 1.0, 0.0, 0.05), (4, 1.0, 0.0, 0.1), (5, 1.0, 0.45, 0.4), (6, 1.0, 0.85, 0.75), (7, 1.0, 1.0, 1.0), (8, 1.0, 1.0, 1.0), (9, 1.0, 0.55, 0.6), (10, 0.7, 0.2, 0.3), (11, 0.3, 0.0, 0.1), (12, 0.0, 0.0, 0.0)):
    pose(kc, kh, ln); key_all(fr)
if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
set_action('idle'); sc.frame_set(1)
out = os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')); bpy.ops.wm.save_as_mainfile(filepath=out)
print('thrust built: frames', act.frame_start, 'to', act.frame_end, '; saved', out)
