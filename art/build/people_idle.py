"""The people's idle made the hero's (2026-10-21, Robin's laggy idles; the developer passed on his go): the people's own Mixamo idle
is a ten-second loop, so at a smooth eight frames a second it would need 80 frames (about 165 MB for the set). The hero's idle,
one breath in 3.8 seconds (Robin's pick for the hero, 2026-10-20), is copied from the kit's file into the people's and takes the
name 'idle'; the old one stays as 'idle_long'. The people's rig is the hero's (people_build.py starts from his model).
  node tools/blender.js work/people_idle/build/people_idle.py -- <people.blend in> <hero_kit.blend> <people.blend out>"""
import bpy, os, sys
argv = sys.argv[sys.argv.index('--') + 1:]
IN, KIT, OUT = (os.path.abspath(a) for a in argv[:3])
bpy.ops.wm.open_mainfile(filepath=IN)
rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
with bpy.data.libraries.load(KIT, link=False) as (src, dst): dst.actions = ['idle']
hero = dst.actions[0]
old = bpy.data.actions.get('idle')
if old: old.name = 'idle_long'; old.use_fake_user = True
hero.name = 'idle'; hero.use_fake_user = True
# the rig check: every bone the hero's idle moves is in the people's rig, and the bones are the same length
paths = {fc.data_path.split('"')[1] for fc in (hero.fcurves if hasattr(hero, 'fcurves') else []) if '"' in fc.data_path}
if not paths:
    for layer in getattr(hero, 'layers', []):
        for strip in layer.strips:
            for bag in strip.channelbags:
                paths |= {fc.data_path.split('"')[1] for fc in bag.fcurves if '"' in fc.data_path}
missing = sorted(p for p in paths if p not in rig.pose.bones)
print('PIDLE the hero idle moves', len(paths), 'bones; missing in the people rig:', missing or 'none', '; range', tuple(hero.frame_range))
for n in ('Hips', 'LeftUpLeg', 'LeftLeg', 'Spine2', 'LeftArm', 'Head'):
    b = rig.data.bones.get('mixamorig:' + n); print('PIDLE', n, 'length %.4f' % b.length if b else 'missing')
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('PIDLE saved', OUT)
