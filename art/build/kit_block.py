"""The weapon's block for the hero's kit (2026-10-20; Robin, after playing chapter 1: "When blocking/parrying without a shield you
should just raise your weapon, not the other arm"). Two clips keyed on the kit's rig, as shield_build.py made the shield's:
  block_wpn        from the idle's stance the right arm comes up and across: the upper arm forward and out, the forearm angled up
                   toward the left, so the blade crosses in front of him from low right to high left, a parry; across by the
                   ninth frame of twelve, then held
  block_wpn_walk   the walk's own frames with the right arm held so (he walks with his guard up)
The bones are aimed at directions in the world (no axis guessed); the wrist turns the blade a little flatter across the body.
  node tools/blender.js art/build/kit_block.py -- <in.blend> <out.blend> [--arm x,y,z] [--fore x,y,z] [--wrist deg]"""
import bpy, math, os, sys
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:]
IN, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
def opt(k, d): return Vector([float(v) for v in argv[argv.index(k) + 1].split(',')]) if k in argv else Vector(d)
A_DIR = opt('--arm', (-0.4, -0.8, 0.0)).normalized()         # the right upper arm: forward and out to his right (chosen from four test poses, 2026-10-20)
F_DIR = opt('--fore', (0.85, -0.2, 0.5)).normalized()        # the forearm: across toward his left and up, so the blade crosses in front of the face
WRIST = float(argv[argv.index('--wrist') + 1]) if '--wrist' in argv else 0.0
bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
def set_action(act):
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
def aim(bn, d):
    pb = rig.pose.bones[bn]; Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation(); Rm = Mw.to_3x3().normalized(); d = Vector(d).normalized()
    cur = (Rm @ Vector((0, 1, 0))).normalized(); R2 = cur.rotation_difference(d).to_matrix() @ Rm
    M2 = R2.to_4x4(); M2.translation = loc; pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
def keyb(pb, f): pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=f)
for n in ('block_wpn', 'block_wpn_walk'):
    if n in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions[n])

# ---- block_wpn: from the idle's first frame ----
idle = bpy.data.actions['idle']; act = idle.copy(); act.name = 'block_wpn'; act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = 12
set_action(act)
for fc in [fc for fc in getattr(act, 'fcurves', [])]: pass
sc.frame_set(int(idle.frame_start) if idle.use_frame_range else 1); bpy.context.view_layer.update()
BASE = {pb.name: (pb.rotation_quaternion.copy(), pb.location.copy()) for pb in rig.pose.bones}
start = int(idle.frame_start) if idle.use_frame_range else 1
# the clip holds the idle's first pose for every bone but the right arm, which is keyed toward the guard
act2 = bpy.data.actions.new('block_wpn'); bpy.data.actions.remove(act); act = act2; act.name = 'block_wpn'; act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = 12
set_action(act)
for f, k in ((1, 0.0), (3, 0.45), (5, 0.75), (7, 0.93), (9, 1.0), (12, 1.0)):
    for pb in rig.pose.bones:
        q, l = BASE[pb.name]; pb.rotation_quaternion = q; pb.location = l
    bpy.context.view_layer.update()
    ua = rig.pose.bones['mixamorig:RightArm']; cur = ((rig.matrix_world @ ua.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized(); aim('mixamorig:RightArm', cur.lerp(A_DIR, k))
    fa = rig.pose.bones['mixamorig:RightForeArm']; curf = ((rig.matrix_world @ fa.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized(); aim('mixamorig:RightForeArm', curf.lerp(F_DIR, k))
    hb = rig.pose.bones.get('mixamorig:RightHand')
    if hb: hb.rotation_quaternion = Quaternion(Vector((0, 0, 1)), math.radians(WRIST * k))
    for pb in rig.pose.bones:
        pb.keyframe_insert('location', frame=f); keyb(pb, f)

# ---- block_wpn_walk: the walk with the guard up ----
walk = bpy.data.actions['walk']; bw = walk.copy(); bw.name = 'block_wpn_walk'; bw.use_fake_user = True
set_action(bw); w0, w1 = int(round(walk.frame_range[0])), int(round(walk.frame_range[1]))
for f in range(w0, w1 + 1):
    sc.frame_set(f); bpy.context.view_layer.update()
    aim('mixamorig:RightArm', A_DIR); aim('mixamorig:RightForeArm', F_DIR)
    hb = rig.pose.bones.get('mixamorig:RightHand')
    if hb: hb.rotation_quaternion = Quaternion(Vector((0, 0, 1)), math.radians(WRIST))
    for bn in ('mixamorig:RightArm', 'mixamorig:RightForeArm', 'mixamorig:RightHand'):
        if bn in rig.pose.bones: keyb(rig.pose.bones[bn], f)
set_action(bpy.data.actions['idle']); sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('KIT BLOCK', os.path.basename(OUT), 'block_wpn 1-12; block_wpn_walk', w0, '-', w1, 'arm', tuple(round(v, 2) for v in A_DIR), 'fore', tuple(round(v, 2) for v in F_DIR), 'wrist', WRIST)
