"""Hands for the hero's kit (2026-10-20; Robin said yes to "real hands": the rig is Mixamo's No Fingers skeleton, whose hand
bones came only as end points with no motion, so the hands rode on the forearms and every weapon continued the forearm's line).
Here: a hand bone at each wrist (the forearm's own end, pointing on along it), the hands bound to it, and everything held in a
hand moved onto it (the shield stays strapped to the forearm). Every clip keys the wrists straight, as before; the player's
blows then turn the right wrist: cocked back at the top of the backswing, snapping through the blow so the blade leads at the
contact frame, and easing straight again in the follow-through. A blade so swung draws a wider arc than the arm alone.

  node tools/blender.js art/build/kit_hands.py -- <in.blend> <out.blend> [--test X|Z <degrees>]
      --test: no swing keys; the right wrist held turned about its own X or Z for every clip (to see which way bends the blade)"""
import bpy, math, os, sys
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:]
IN, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
TEST = (argv[argv.index('--test') + 1], float(argv[argv.index('--test') + 2])) if '--test' in argv else None
bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE'); vl = bpy.context.view_layer

# ---- the hand bones, at the wrists, going on along the forearms ----
for o in vl.objects: o.select_set(False)
vl.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones
for side in ('Right', 'Left'):
    if ('mixamorig:%sHand' % side) in eb: continue
    fa = eb['mixamorig:%sForeArm' % side]; hb = eb.new('mixamorig:%sHand' % side)
    d = (fa.tail - fa.head).normalized(); hb.head = fa.tail.copy(); hb.tail = fa.tail + d * 0.08; hb.roll = fa.roll; hb.parent = fa; hb.use_connect = True
bpy.ops.object.mode_set(mode='OBJECT')
for side in ('Right', 'Left'): rig.pose.bones['mixamorig:%sHand' % side].rotation_mode = 'QUATERNION'

# ---- the hands bound to them; the things held in a hand moved onto them, where they are now ----
for n, side in (('hand.R', 'Right'), ('hand.L', 'Left')):
    o = bpy.data.objects.get(n)
    if o:
        for g in o.vertex_groups:
            if g.name == 'mixamorig:%sForeArm' % side: g.name = 'mixamorig:%sHand' % side
rig.data.pose_position = 'REST'; vl.update()
moved = 0
for o in bpy.data.objects:
    if o.parent is rig and o.parent_type == 'BONE' and o.parent_bone in ('mixamorig:RightForeArm', 'mixamorig:LeftForeArm'):
        mw = o.matrix_world.copy(); o.parent_bone = o.parent_bone.replace('ForeArm', 'Hand'); vl.update(); o.matrix_world = mw; moved += 1
rig.data.pose_position = 'POSE'; vl.update()

# ---- the wrists keyed in every clip; the player's blows turn the right wrist ----
def set_action(act):
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
def key(bone, f, q):
    pb = rig.pose.bones[bone]; pb.rotation_quaternion = q; pb.keyframe_insert('rotation_quaternion', frame=f)
AX = {'X': Vector((1, 0, 0)), 'Z': Vector((0, 0, 1))}
# the blows: (frame, angle in degrees) about the wrist's own Z, the axis that swings the blade in the plane of the cut; the two slashes
# cut opposite ways, so their signs are opposite (chosen from test renders of both axes and signs, 2026-10-20). The thrust keeps a
# straight wrist (a spear is pushed, not whipped); chop and mine too.
SWING = {'attack1': ('Z', -1.0, [(21, -40), (25, -15), (29, 22), (33, 10), (40, 0)]), 'attack2': ('Z', 1.0, [(31, -40), (35, -15), (39, 22), (43, 10), (50, 0)])}
for act in bpy.data.actions:
    set_action(act); f0 = int(act.frame_start) if act.use_frame_range else int(act.frame_range[0])
    for side in ('Right', 'Left'): key('mixamorig:%sHand' % side, f0 if f0 > 1 else 1, Quaternion())
    if TEST:
        key('mixamorig:RightHand', 1, Quaternion(AX[TEST[0]], math.radians(TEST[1]))); key('mixamorig:RightHand', int(act.frame_range[1]), Quaternion(AX[TEST[0]], math.radians(TEST[1])))
    elif act.name in SWING:
        ax, sg, keys = SWING[act.name]
        if '--flex' in argv: ax, sg = argv[argv.index('--flex') + 1], float(argv[argv.index('--sign') + 1]) * (1 if act.name == 'attack1' else -1)
        for f, a in keys: key('mixamorig:RightHand', f, Quaternion(AX[ax], sg * math.radians(a)))
set_action(bpy.data.actions['idle']); sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('KIT HANDS', os.path.basename(OUT), 'moved to the hands:', moved, 'test' if TEST else 'swings: ' + ','.join(SWING))
