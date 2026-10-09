"""Prints which way each bone's tail moves for +30 degrees about its local X, Y, Z (2026-10-09): the sign check for the
animations in hero_build.py.  node tools/blender.js art/build/probe.py -- art/source/hero.blend"""
import bpy, math, sys
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath=sys.argv[sys.argv.index('--') + 1])
rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
rig.animation_data.action = None
for pb in rig.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
bpy.context.view_layer.update()
def tail(name): return (rig.matrix_world @ rig.pose.bones[name].tail).copy()
for name in ['hips', 'spine', 'chest', 'head', 'upper_arm.L', 'forearm.L', 'hand.L', 'thigh.L', 'shin.L', 'foot.L', 'upper_arm.R', 'thigh.R']:
    pb = rig.pose.bones[name]; base = tail(name); out = []
    for ax in range(3):
        r = [0, 0, 0]; r[ax] = math.radians(30); pb.rotation_euler = r; bpy.context.view_layer.update()
        d = tail(name) - base; pb.rotation_euler = (0, 0, 0)
        out.append('xyz'[ax] + ':(' + ','.join('%+.2f' % v for v in d) + ')')
    bpy.context.view_layer.update()
    print('%-12s' % name, '  '.join(out))
# the walk's phase: at a quarter through, the left leg should be forward (-Y) and the left arm back (+Y)
act = bpy.data.actions['walk']; rig.animation_data.action = act
if hasattr(rig.animation_data, 'action_slot') and len(act.slots): rig.animation_data.action_slot = act.slots[0]
bpy.context.scene.frame_set(7); bpy.context.view_layer.update()
for b in ('foot.L', 'foot.R', 'hand.L', 'hand.R'): print('walk quarter', b, 'y %+.3f' % tail(b).y)
