"""Prints the Mixamo rig's hand bones and, for a few frames of attack1 and chop, the right hand's position and its local axes in
world space, to choose how a thing in the hand is parented and which way its blade points (2026-10-09).
  node tools/blender.js art/build/probe_hand.py"""
import bpy, os, sys
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
names = [b.name for b in rig.data.bones]
print('bones', len(names)); print([n for n in names if 'Hand' in n or 'ForeArm' in n or 'Arm' in n])
print('actions', sorted(a.name for a in bpy.data.actions))
print('rig matrix_world scale', rig.matrix_world.to_scale(), 'parent', rig.parent and rig.parent.name)
def set_action(name):
    act = bpy.data.actions[name]; ad = rig.animation_data; ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
for an in ['idle', 'attack1', 'chop']:
    act = set_action(an); f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
    for f in [f0, f0 + (f1 - f0) // 3, f0 + 2 * (f1 - f0) // 3]:
        sc.frame_set(f)
        for bn in ['mixamorig:RightForeArm', 'mixamorig:RightHand']:
            if bn not in rig.pose.bones: continue
            pb = rig.pose.bones[bn]; M = rig.matrix_world @ pb.matrix
            head = rig.matrix_world @ pb.head; tail = rig.matrix_world @ pb.tail
            X, Y, Z = M.to_3x3().col[0].normalized(), M.to_3x3().col[1].normalized(), M.to_3x3().col[2].normalized()
            print('%-8s f%3d %-24s head %s tail %s | X %s Y %s Z %s' % (an, f, bn.split(':')[1], tuple(round(v, 2) for v in head), tuple(round(v, 2) for v in tail), tuple(round(v, 2) for v in X), tuple(round(v, 2) for v in Y), tuple(round(v, 2) for v in Z)))
# the body parts' names and which bone the hand part rides on
for o in bpy.data.collections['Body'].objects:
    if 'hand' in o.name.lower(): print('part', o.name, [g.name for g in o.vertex_groups], 'loc', tuple(round(v, 2) for v in o.matrix_world.translation))
