"""Binds the hero's parts to the Mixamo skeleton and gathers the Mixamo animations (2026-10-09). Opens hero2.blend, imports
art/source/mixamo/hero_idle.fbx (with skin: the skeleton fitted to the rigging proxy), throws the proxy mesh away, and gives
every body and gear part a vertex group on the matching mixamorig bone instead of its own rig's bone (the parts stay rigid, one
bone each, as before; in the T-pose nothing moves, so the fit is exact there; the No Fingers skeleton has no hand bones, so the
hands ride on the forearms). Then every other FBX (without skin) is imported
for its action, which is renamed to the file's short name (idle, walk, run, attack1 ...) and kept; the extra armatures go.
The armature sits under an empty 'Turn' which render.py rotates for the directions (the imported armature keeps its FBX
rotation and scale). Saves art/source/hero2_mixamo.blend and prints a check per action: its length, whether the hips travel
(root motion) and how far the feet slide.   node tools/blender.js art/build/mixamo_bind.py"""
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source'); MX = os.path.join(SRC, 'mixamo')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2.blend')))
sc = bpy.context.scene; body = bpy.data.collections['Body']; gear = bpy.data.collections['Gear']
old_rig = next(o for o in sc.objects if o.type == 'ARMATURE')
for a in list(bpy.data.actions): bpy.data.actions.remove(a)      # the hand-made idle and walk: Mixamo's take their names

MAP = {'root': 'mixamorig:Hips', 'hips': 'mixamorig:Hips', 'spine': 'mixamorig:Spine1', 'chest': 'mixamorig:Spine2', 'neck': 'mixamorig:Neck', 'head': 'mixamorig:Head',
       'upper_arm.L': 'mixamorig:LeftArm', 'forearm.L': 'mixamorig:LeftForeArm', 'hand.L': 'mixamorig:LeftForeArm', 'thigh.L': 'mixamorig:LeftUpLeg', 'shin.L': 'mixamorig:LeftLeg', 'foot.L': 'mixamorig:LeftFoot',
       'upper_arm.R': 'mixamorig:RightArm', 'forearm.R': 'mixamorig:RightForeArm', 'hand.R': 'mixamorig:RightForeArm', 'thigh.R': 'mixamorig:RightUpLeg', 'shin.R': 'mixamorig:RightLeg', 'foot.R': 'mixamorig:RightFoot'}

def import_fbx(path):
    before = set(bpy.data.objects); bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False, ignore_leaf_bones=True)
    return [o for o in bpy.data.objects if o not in before]

# the skeleton, from the file with skin
new = import_fbx(os.path.join(MX, 'hero_idle.fbx'))
rig = next(o for o in new if o.type == 'ARMATURE'); rig.name = 'Mixamo'
for o in new:
    if o.type == 'MESH': bpy.data.objects.remove(o)
turn = bpy.data.objects.new('Turn', None); sc.collection.objects.link(turn); rig.parent = turn
names = {b.name for b in rig.data.bones}
missing = [v for v in set(MAP.values()) if v not in names]
print('bones', len(names), 'missing', missing)
def rebind(o):
    groups = [g.name for g in o.vertex_groups]
    for g in groups:
        if g in MAP: o.vertex_groups[g].name = MAP[g]
    for md in o.modifiers:
        if md.type == 'ARMATURE': md.object = rig
    o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()     # keep the part where it is: the imported armature carries the FBX rotation and 0.01 scale
for o in list(body.objects) + list(gear.objects): rebind(o)
bpy.data.objects.remove(old_rig)

# the actions from the files without skin
act_idle = rig.animation_data.action if rig.animation_data else None
if act_idle: act_idle.name = 'idle'; act_idle.use_fake_user = True
for fn in sorted(os.listdir(MX)):
    if not fn.endswith('.fbx') or fn == 'hero_idle.fbx': continue
    short = fn[5:-4]; objs = import_fbx(os.path.join(MX, fn)); arm = next((o for o in objs if o.type == 'ARMATURE'), None)
    if not arm or not arm.animation_data or not arm.animation_data.action: print('no action in', fn); continue
    act = arm.animation_data.action; act.name = short; act.use_fake_user = True
    for o in objs: bpy.data.objects.remove(o)
for a in list(bpy.data.armatures):
    if a.users == 0: bpy.data.armatures.remove(a)

# the checks: play each action and watch the hips and the feet
def set_action(name):
    act = bpy.data.actions[name]; ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
def world(bn): return rig.matrix_world @ rig.pose.bones[bn].head
for act in sorted(bpy.data.actions, key=lambda a: a.name):
    set_action(act.name); f0, f1 = int(act.frame_range[0]), int(act.frame_range[1]); hips = []; feet = []
    for f in range(f0, f1 + 1, max(1, (f1 - f0) // 12)):
        sc.frame_set(f); hips.append(world('mixamorig:Hips').copy()); feet.append((world('mixamorig:LeftFoot').z, world('mixamorig:RightFoot').z))
    travel = max((h - hips[0]).xy.length for h in hips); fz = min(min(a, b) for a, b in feet)
    print('%-12s frames %3d-%3d  hips travel %.2f m  lowest foot z %.2f' % (act.name, f0, f1, travel, fz))
set_action('idle'); sc.frame_set(1)
out = os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')); bpy.ops.wm.save_as_mainfile(filepath=out); print('saved', out)
