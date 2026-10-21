"""The ship's two clips for the people (2026-10-21, the studio; the developer's ships plan, on Robin's yes). Opens the game's
people.blend (the one body with its layers) and adds, on folk_build.py's conventions (bones aimed at directions in the world, every
bone keyed each frame, the sit's pose as the base so the legs and hips are the seated ones):

  row    8 frames, looped: one stroke of an oar, seated. The pull is the first two fifths (frames 1 to 3: the body leans back,
         the arms draw the handle to the chest), the recovery the rest (frames 4 to 8: the body leans forward, the arms reach out
         long). No oar in the clip: the game draws it from the hands over the rail to the blade. At the catch the hands are out in
         front at chest height, at the finish at the chest.
  helm   8 frames, a short idle, held: seated, the right arm out to the side and a little back onto a tiller at hip height, the
         left hand in the lap, looking forward; the tiller arm works a little and the body sways with the sea.

  node tools/blender.js rowing_build.py -- <in people.blend> <out rowing.blend> [--catch_a x,y,z --catch_f x,y,z --fin_a x,y,z --fin_f x,y,z]
The directions are numbers at the top; a pose is changed by changing a number. Forward for the figure is -Y, his right is +X."""
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
IN, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
def opt(k, d): return tuple(float(v) for v in argv[argv.index(k) + 1].split(',')) if k in argv else d
bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')

def set_action(act):
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
def aim(bn, d):
    pb = rig.pose.bones['mixamorig:' + bn]; Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation(); Rm = Mw.to_3x3().normalized(); d = Vector(d).normalized()
    cur = (Rm @ Vector((0, 1, 0))).normalized(); R2 = cur.rotation_difference(d).to_matrix() @ Rm
    M2 = R2.to_4x4(); M2.translation = loc; pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
def key_all(f):
    for pb in rig.pose.bones: pb.keyframe_insert('location', frame=f); pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=f)
def lerp3(a, b, k): return Vector(a).lerp(Vector(b), k)
def ease(k): return k * k * (3 - 2 * k)
def new_action(name, n):
    if name in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions[name])
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = n; set_action(act); return act
def cur_dir(bn): pb = rig.pose.bones['mixamorig:' + bn]; return ((rig.matrix_world @ pb.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
def arms(RA, RF, LA, LF): aim('RightArm', RA); aim('RightForeArm', RF); aim('LeftArm', LA); aim('LeftForeArm', LF)

# the seated base: the sit clip's first pose (the legs, the hips, the back as the game's sit has them)
sit = bpy.data.actions['sit']; set_action(sit); s0 = int(round(sit.frame_range[0])); sc.frame_set(s0); bpy.context.view_layer.update()
SIT = {pb.name: (pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.location.copy()) for pb in rig.pose.bones}
def to_sit():
    for pb in rig.pose.bones: q, e, l = SIT[pb.name]; pb.rotation_quaternion = q; pb.rotation_euler = e; pb.location = l
    bpy.context.view_layer.update()
to_sit(); SIT_SPINE = cur_dir('Spine2')

# ---- row: the catch (reaching forward, leaning forward) to the finish (leaning back, the handle at the chest) and back ----
CATCH_A = opt('--catch_a', (0.16, -0.86, -0.49)); CATCH_F = opt('--catch_f', (0.0, -0.98, -0.2))     # the upper arm forward and down, the forearm straight on forward: the hands out in front at chest height
FIN_A = opt('--fin_a', (0.2, 0.3, -0.93)); FIN_F = opt('--fin_f', (-0.08, -0.78, 0.62))              # the upper arm down and a little back (the elbow behind), the forearm forward and up to the chest
LEAN_FWD = Vector((0, -0.5, 0.87)); LEAN_BACK = Vector((0, 0.42, 0.91))                              # the back at the catch and at the finish
act = new_action('row', 8)
for f in range(1, 9):
    p = (f - 1) / 8
    k = ease(p / 0.4) if p < 0.4 else 1 - ease((p - 0.4) / 0.6)                                        # k 0 at the catch, 1 at the finish; the pull the first two fifths, the recovery the rest
    to_sit(); aim('Spine2', lerp3(LEAN_FWD, LEAN_BACK, k)); aim('Head', lerp3((0, -0.35, 0.94), (0, 0.05, 1.0), k))
    arms(lerp3(CATCH_A, FIN_A, k), lerp3(CATCH_F, FIN_F, k), lerp3((-CATCH_A[0], CATCH_A[1], CATCH_A[2]), (-FIN_A[0], FIN_A[1], FIN_A[2]), k), lerp3((-CATCH_F[0], CATCH_F[1], CATCH_F[2]), (-FIN_F[0], FIN_F[1], FIN_F[2]), k))
    key_all(f)

# ---- helm: seated, the right hand out to the side and back on the tiller, the left in the lap; a little work at the tiller and a sway ----
TILLER_A = (0.86, 0.3, -0.42); TILLER_F = (0.75, 0.45, -0.5)                                       # the right upper arm out to his right and a little back, the forearm on out and down to a tiller at hip height beside him
act = new_action('helm', 8)
for f in range(1, 9):
    w = 2 * math.pi * (f - 1) / 8; k = 0.5 + 0.5 * math.sin(w)
    to_sit(); aim('Spine2', lerp3((0.04, -0.08, 0.99), (-0.04, -0.1, 0.99), k)); aim('Head', (0, -0.3, 0.95))
    arms(lerp3(TILLER_A, (0.84, 0.36, -0.42), k), lerp3(TILLER_F, (0.7, 0.55, -0.46), k), (-0.22, -0.4, -0.89), (0.15, -0.9, 0.42))
    key_all(f)

set_action(bpy.data.actions['idle']); sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('ROWING', os.path.basename(OUT), 'row 1-8 (pull to frame 3), helm 1-8; catch', CATCH_A, CATCH_F, 'finish', FIN_A, FIN_F)
