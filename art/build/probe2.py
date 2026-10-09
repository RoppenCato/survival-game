"""Prints the tail displacement of a few bones of hero2 for +20 and -20 degrees about each local axis, in the T-pose and with
the arms hanging: node tools/blender.js art/build/probe2.py -- art/source/hero2.blend"""
import bpy, math, sys
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath=sys.argv[sys.argv.index('--') + 1])
rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE'); rig.animation_data.action = None
def reset():
    for pb in rig.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    bpy.context.view_layer.update()
def show(name, base_rot=None):
    pb = rig.pose.bones[name]; reset()
    if base_rot: rig.pose.bones['upper_arm.L'].rotation_euler = base_rot; rig.pose.bones['upper_arm.R'].rotation_euler = base_rot; bpy.context.view_layer.update()
    base = pb.tail.copy(); out = []
    for ax in range(3):
        for sg in (1, -1):
            r = [0, 0, 0]; r[ax] = sg * math.radians(20); pb.rotation_euler = r; bpy.context.view_layer.update()
            d = pb.tail - base; out.append('%s%s:(%+.2f,%+.2f,%+.2f)' % ('xyz'[ax], '+' if sg > 0 else '-', d.x, d.y, d.z)); pb.rotation_euler = (0, 0, 0)
    print('%-12s' % name, ('hang ' if base_rot else 'T    '), '  '.join(out))
show('upper_arm.L'); show('forearm.L'); show('forearm.L', (math.radians(-75), 0, 0)); show('hand.L', (math.radians(-75), 0, 0)); show('thigh.L'); show('spine')
