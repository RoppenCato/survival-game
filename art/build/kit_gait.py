"""The hero's walk and run remade so the feet stay planted at the game's speeds (2026-10-21; Robin: the walk "gets a bit of a moon
walk feel"; yes to the fix). The Mixamo walk and run are made in place with short strides (the planted foot slides 0.86 and
2.8 m/s as the game played them) while the game moves the hero 84 and 130 units a second; the kit's rig is 1.63 m drawn 39
units, so 3.5 and 5.4 m/s. At those speeds a man of his build jogs and runs, so the walk becomes a light jog and the sprint a
full run, each built here from the ground up:

  every foot follows a path: planted and sliding back under the body at exactly the ground speed through the stance (heel
  strike, flat, the heel rising over the ball at the push-off), lifted and carried forward through the swing (the heel kicking
  up behind first, the foot reaching forward before it lands); the hips are lowered so the legs reach, and bob, lowest at
  mid-stance; a two-bone solver in each leg's own plane, the knee toward the front, finds the thigh and the shin; the body
  leans into the run; the arms swing against the legs, bent at the elbow. Every bone is keyed each frame (the folk clips' way:
  bones aimed at directions in the world, no axis guessed).

  The old clips are kept as walk_mixamo and run_mixamo. Each new action is one loop of N frames (frame 1 to N), so the
  renderer's N frames are its N keys; the stride (ground units a loop) and the playing rate are written as custom properties
  'stride_m' and 'cycle_s' on the action for the packer's json.
  node tools/blender.js kit_gait.py -- <in.blend> <out.blend> [--walk N,T,beta] [--run N,T,beta] [--only a,b] [--table people]"""
import bpy, math, os, sys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
IN, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
def opt(k, d): return tuple(float(v) for v in argv[argv.index(k) + 1].split(',')) if k in argv else d
UNITS_PER_M = 39 / 1.632                                  # the kit's figure: 1.632 m to the top of the head, drawn 39 units tall
SPEED = {'walk': 84 / UNITS_PER_M, 'run': 130 / UNITS_PER_M}   # the game's walking and sprinting speeds (src/combat.js: 84, x1.55), in the rig's metres a second
# 2026-10-21, second pass: the first numbers (hips 8.5 cm down, the back curled forward, fists before the chest) made a crouched scurry;
# now the hips sit 2.5 and 5 cm down (2.5 once the foot pitch was fixed, the third pass); 'apart' is the ball's side offset: the toes
# turn out, so the ankles land about 4 cm nearer the middle (0.13 puts them near under the hip joints, 0.108 out; 0.085 was a tightrope), the back leans straight from the hips, the head is level, the fists swing by the belt.
# 2026-10-21, fourth pass (Robin: "feel a little robotic... the torso isnt moving at all and hes all straight"): the body moves now:
# the hips turn toward the leg that swings (pelvis_yaw) and dip on its side (pelvis_roll), shift over the planted foot (sway, in step
# now: it was a quarter loop late), the chest turns against the hips (chest_yaw) and the back bends a little with the hips (side),
# the lean breathes with the push-offs (lean_osc), the head keeps looking ahead (head_hold), the arms trail the legs a touch
# (arm_lag) and the forearm trails the arm, bending more at the front of the swing (fore_lag, fore_swing).
GAIT = {   # N frames a loop, T seconds a loop, beta (each foot's share of the loop on the ground), lift, hips drop, bob, lean, arm swing, elbow bend, feet apart,
           # the spine's share of the lean per bone, the neck's share, the head's tilt, the arms' rest behind the body (degrees)
    'walk': dict(N=int(opt('--walk', (12, 0.6, 0.22))[0]), T=opt('--walk', (12, 0.6, 0.22))[1], beta=opt('--walk', (12, 0.6, 0.22))[2], lift=0.20, drop=0.025, bob=0.022, lean=7, arm=30, bend=70, apart=0.13,
             spine=(1, 1, 1), neck=0.3, head=0.0, back=12,
             sway=0.022, pelvis_yaw=8, pelvis_roll=4, chest_yaw=10, side=0.5, lean_osc=1.5, head_hold=0.75, arm_lag=0.04, fore_lag=0.08, fore_swing=14),
    'run': dict(N=int(opt('--run', (10, 0.5, 0.25))[0]), T=opt('--run', (10, 0.5, 0.25))[1], beta=opt('--run', (10, 0.5, 0.25))[2], lift=0.30, drop=0.05, bob=0.028, lean=11, arm=48, bend=85, apart=0.115,
            spine=(1, 1, 1), neck=0.4, head=0.02, back=10,
            sway=0.014, pelvis_yaw=10, pelvis_roll=4, chest_yaw=14, side=0.5, lean_osc=2.5, head_hold=0.75, arm_lag=0.04, fore_lag=0.08, fore_swing=12),
    # a real walk, for Robin to see beside the jog (2026-10-21; demo: built only when named with --only): at 34 units a second
    # (1.4 m/s, 40 per cent of the game's 84) a man of his build can walk with both feet down a moment each step and no flight:
    # the body vaults over the planted leg (highest at mid-stance, bob < 0), the feet skim, the arms hang and swing from the shoulder
    'walk_slow': dict(N=16, T=0.75, beta=0.58, lift=0.07, drop=0.035, bob=-0.015, lean=3, arm=24, bend=20, apart=0.12, speed=34, demo=True,
                      spine=(1, 1, 1), neck=0.3, head=0.0, back=4,
                      sway=0.03, pelvis_yaw=7, pelvis_roll=5, chest_yaw=8, side=0.6, lean_osc=1, head_hold=0.75, arm_lag=0.05, fore_lag=0.1, fore_swing=15),
    # the guard walks (2026-10-21; the developer: guard up = x0.55, so 46.2 units a second walking, 71.6 sprinting; one clip with the
    # stride for 46.2 and the distance does the rest): the old clip's upper body stays (the shield or the weapon held up, keep=True);
    # the legs are a short quick crouched walk, both feet down a moment each step, the hips highest over the planted foot (bob < 0)
    'block_walk': dict(N=12, T=0.7, beta=0.54, lift=0.08, drop=0.06, bob=-0.010, lean=0, arm=0, bend=0, apart=0.155, keep=True, speed=46.2),
    'block_wpn_walk': dict(N=12, T=0.7, beta=0.54, lift=0.08, drop=0.06, bob=-0.010, lean=0, arm=0, bend=0, apart=0.155, keep=True, speed=46.2),
}
# the people (2026-10-21; Robin: "The villagers will do more walking generally, so i think they should do more strolling at a slower
# speed, then run when needed"; the developer's speeds: villagers walk 38, 30 with a bucket, 44 going home, flee at 70; the hird walks
# 40 at work and 70 following; the engine's men walk 60 and run 94; the frame is picked by distance, so each clip serves a range):
#   walk        a real stroll made for 38: both feet down each step, the body vaulting over the planted leg, arms hanging
#   jog         new, made for 60 (the men on raids and in the Battle test): the hero's jog, a little slower
#   run         made for 80 (fleeing at 70, the men at 94)
#   carry_walk  the bucket walk made for 30: the old clip's upper body (the arm holding the bucket), new legs
STROLL = dict(sway=0.03, pelvis_yaw=7, pelvis_roll=5, chest_yaw=8, side=0.6, lean_osc=1, head_hold=0.75, arm_lag=0.05, fore_lag=0.1, fore_swing=15, spine=(1, 1, 1), neck=0.3, head=0.0)
PEOPLE = {
    'walk': dict(N=12, T=0.72, beta=0.56, lift=0.07, drop=0.035, bob=-0.015, lean=3, arm=24, bend=20, apart=0.12, back=4, speed=38, **STROLL),
    'jog': dict(N=10, T=0.62, beta=0.30, lift=0.16, drop=0.025, bob=0.018, lean=5, arm=28, bend=65, apart=0.13, back=10, speed=60,
                spine=(1, 1, 1), neck=0.3, head=0.0, sway=0.02, pelvis_yaw=8, pelvis_roll=4, chest_yaw=10, side=0.5, lean_osc=1.5, head_hold=0.75, arm_lag=0.04, fore_lag=0.08, fore_swing=14),
    'run': dict(N=10, T=0.58, beta=0.24, lift=0.22, drop=0.03, bob=0.024, lean=8, arm=36, bend=75, apart=0.125, back=10, speed=80,
                spine=(1, 1, 1), neck=0.35, head=0.01, sway=0.016, pelvis_yaw=9, pelvis_roll=4, chest_yaw=12, side=0.5, lean_osc=2, head_hold=0.75, arm_lag=0.04, fore_lag=0.08, fore_swing=12),
    'carry_walk': dict(N=12, T=0.8, beta=0.58, lift=0.06, drop=0.03, bob=-0.012, lean=0, arm=0, bend=0, apart=0.12, keep=True, speed=30),
}
if '--table' in argv and argv[argv.index('--table') + 1] == 'people': GAIT = PEOPLE
ONLY = argv[argv.index('--only') + 1].split(',') if '--only' in argv else None   # rebuild only these clips
import json
for _k, _e in (('walk', 'GAIT_W'), ('run', 'GAIT_R'), ('block_walk', 'GAIT_B'), ('block_wpn_walk', 'GAIT_B'), ('jog', 'GAIT_J'), ('carry_walk', 'GAIT_C')):     # trials without editing: GAIT_W='{"drop":0.04}' and so on
    if os.environ.get(_e) and _k in GAIT: GAIT[_k].update(json.loads(os.environ[_e]))
bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE'); FPS = sc.render.fps
B = lambda n: rig.pose.bones['mixamorig:' + n]
def set_action(act):
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
def aim(bn, d):
    pb = B(bn); Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation(); Rm = Mw.to_3x3().normalized(); d = Vector(d).normalized()
    cur = (Rm @ Vector((0, 1, 0))).normalized(); R2 = cur.rotation_difference(d).to_matrix() @ Rm
    M2 = R2.to_4x4(); M2.translation = loc; pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
def rot_world(bn, axis, deg):                           # turn a bone about a world axis through its head
    pb = B(bn); Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation()
    M2 = Matrix.Translation(loc) @ Matrix.Rotation(math.radians(deg), 4, Vector(axis)) @ Matrix.Translation(-loc) @ Mw
    pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
def yaw_of(bn):                                          # which way a bone faces, seen from above (degrees)
    x = (rig.matrix_world @ B(bn).matrix).to_3x3() @ Vector((1, 0, 0)); return math.degrees(math.atan2(x.y, x.x))
def set_yaw(bn, deg):                                    # turn a bone about the vertical to deg off its neutral heading
    d = (REF[bn] + deg) - yaw_of(bn); d = (d + 180) % 360 - 180; rot_world(bn, (0, 0, 1), d)
REF = {}
def move_hips(delta):
    pb = B('Hips'); Mw = rig.matrix_world @ pb.matrix; Mw.translation = Mw.translation + Vector(delta); pb.matrix = rig.matrix_world.inverted() @ Mw; bpy.context.view_layer.update()
def key_all(f):
    for pb in rig.pose.bones: pb.keyframe_insert('location', frame=f); pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=f)
W = lambda pb_name, end='head': (rig.matrix_world @ (getattr(B(pb_name), end))).copy()
# the base pose: the idle's first frame
idle = bpy.data.actions['idle']; set_action(idle); sc.frame_set(int(idle.frame_range[0])); bpy.context.view_layer.update()
BASE = {pb.name: (pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.location.copy()) for pb in rig.pose.bones}
def to_base():
    for pb in rig.pose.bones: q, e, l = BASE[pb.name]; pb.rotation_quaternion = q; pb.rotation_euler = e; pb.location = l
    bpy.context.view_layer.update()
to_base()
def pose_of(act, u):                                     # the old clip's pose at loop phase u (the guard walks keep its upper body)
    set_action(act); a, b = act.frame_range; f = a + u * (b - a); sc.frame_set(int(f), subframe=f - int(f)); bpy.context.view_layer.update()
    return {pb.name: (pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.location.copy()) for pb in rig.pose.bones}
def put(P):
    for pb in rig.pose.bones: q, e, l = P[pb.name]; pb.rotation_quaternion = q; pb.rotation_euler = e; pb.location = l
    bpy.context.view_layer.update()
LEN = {s: ((W(s + 'UpLeg', 'tail') - W(s + 'UpLeg')).length, (W(s + 'Leg', 'tail') - W(s + 'Leg')).length) for s in ('Left', 'Right')}
FOOTVEC = {s: W(s + 'ToeBase') - W(s + 'Foot') for s in ('Left', 'Right')}           # the ankle to the ball, at rest
BALL_Z = min(W('LeftToeBase').z, W('RightToeBase').z)
HIPS0 = W('Hips')
def rot_x(v, deg):                                       # pitch a vector about the side axis: positive lifts the back end (the heel up when the ball is the pivot)
    a = math.radians(-deg); c, s = math.cos(a), math.sin(a); return Vector((v.x, v.y * c + v.z * s, -v.y * s + v.z * c))   # 2026-10-21 fix: the sign was turned, so the toes rose at the push-off and the ankle sank
def ik(hip, target, a, b, pole=Vector((0, -1, 0))):
    d = target - hip; L = max(abs(a - b) + 1e-3, min(a + b - 1e-4, d.length)); u = d.normalized()
    ca = max(-1.0, min(1.0, (a * a + L * L - b * b) / (2 * a * L))); w = pole - u * pole.dot(u); w = w.normalized() if w.length > 1e-6 else Vector((0, -1, 0))
    knee = hip + (u * ca + w * math.sqrt(max(0.0, 1 - ca * ca))) * a; ankle = hip + u * L; return knee, ankle
def ss(x): x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)
def foot_at(p, G, side_x):
    """the ball's place and the foot's pitch at leg phase p (0: the heel strikes; beta: the toe leaves the ground)"""
    S = SPEED_M * G['T']; beta = G['beta']; travel = S * beta; yc = -0.055                 # the planted ball slides from front to back under the hips
    y_front, y_back = yc - travel / 2, yc + travel / 2
    if p < beta:
        s = p / beta; y = y_front + travel * s; z = BALL_Z
        pitch = -9 * (1 - ss(s / 0.18)) + 38 * ss((s - 0.62) / 0.38)                    # toes up at the strike, flat, the heel rising over the ball at the push-off
    else:
        w = (p - beta) / (1 - beta)
        y = y_back + (y_front - y_back) * ss(w ** 1.15)                                    # the foot stays behind a moment, then swings through and reaches forward
        z = BALL_Z + G['lift'] * math.sin(math.pi * min(1.0, w ** 0.62)) * (1 - 0.25 * w)  # the heel kicks up behind early, the foot comes down before it lands
        pitch = 38 * (1 - ss(w / 0.35)) + 18 * ss((w - 0.25) / 0.3) * (1 - ss((w - 0.7) / 0.3)) - 9 * ss((w - 0.8) / 0.2)
    return Vector((side_x, y, z)), pitch
def build(name, G):
    global SPEED_M
    SPEED_M = G['speed'] / UNITS_PER_M if 'speed' in G else SPEED[name]; N = G['N']
    old = bpy.data.actions.get(name)
    if old and not bpy.data.actions.get(name + '_mixamo'): old.name = name + '_mixamo'; old.use_fake_user = True
    elif old: bpy.data.actions.remove(old)
    src = bpy.data.actions.get(name + '_mixamo') if G.get('keep') else None
    global HX
    HX = 0.0                                             # the feet's middle: under the hips (the guard walks: the old clip's hips, on average)
    xs = []
    if src:
        for i in range(24): pose_of(src, i / 24); xs.append(W('Hips').x)
        HX = sum(xs) / len(xs)
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = N; set_action(act)
    act['stride_m'] = SPEED_M * G['T']; act['cycle_s'] = G['T']; act['stride_units'] = SPEED_M * G['T'] * UNITS_PER_M
    global MISS, MISS_ST
    MISS = []; MISS_ST = []
    if not src:                                          # the neutral headings: the base pose centred, leaned, nothing turned
        to_base(); move_hips((-W('Hips').x, 0.0, 0.0))
        for bn, k2 in zip(('Spine', 'Spine1', 'Spine2'), G.get('spine', (1, 1, 1))): aim(bn, (0, -math.sin(math.radians(G['lean'] * k2)), math.cos(math.radians(G['lean'] * k2))))
        aim('Neck', (0, 0, 1)); aim('Head', (0, 0, 1))
        for bn in ('Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head'): REF[bn] = yaw_of(bn)
    for k in range(N):
        u = k / N
        if src: P = pose_of(src, u); set_action(act); bpy.context.view_layer.update(); put(P)
        else: to_base()
        # the hips: lowered so the legs reach, lowest at each mid-stance, a touch of sway over the planted foot
        bob = -G['bob'] * math.cos(2 * math.pi * 2 * (u - G['beta'] / 2))
        sway = G.get('sway', 0.012) * math.cos(2 * math.pi * (u - G['beta'] / 2))      # over the left foot (+x) at its mid-stance
        move_hips((sway - (0.0 if src else W('Hips').x), 0.0, -G['drop'] + bob))   # 2026-10-21: centred over the feet (the idle's first frame leans 7.5 cm to a side)
        yaw_p = -G.get('pelvis_yaw', 0) * math.cos(2 * math.pi * u)                    # the left hip forward as the left heel strikes (u = 0)
        roll_p = -G.get('pelvis_roll', 0) * math.cos(2 * math.pi * (u - G['beta'] / 2))  # the free leg's hip dips while the other foot carries
        yaw_c = G.get('chest_yaw', 0) * math.cos(2 * math.pi * u)                      # the chest turns against the hips, with the arms
        if not src: set_yaw('Hips', yaw_p); rot_world('Hips', (0, 1, 0), roll_p)
        # the lean: the spine pitched into the run, the head upright looking ahead
        ln = G['lean'] + G.get('lean_osc', 0) * math.cos(4 * math.pi * (u - G['beta']))   # a little more lean at each push-off
        sd = G.get('side', 0) * roll_p
        for bn, k2, sk in ([] if src else zip(('Spine', 'Spine1', 'Spine2'), G.get('spine', (0.5, 0.8, 1.0)), (1.0, 0.0, -0.6))):
            aim(bn, (math.sin(math.radians(sd * sk)), -math.sin(math.radians(ln * k2)), math.cos(math.radians(ln * k2))))
        if not src:
            for bn, wp, wc in (('Spine', 0.66, 0.34), ('Spine1', 0.33, 0.67), ('Spine2', 0.0, 1.0)): set_yaw(bn, wp * yaw_p + wc * yaw_c)
        nk = G.get('neck', 0.5)
        if not src:
            aim('Neck', (0, -math.sin(math.radians(ln * nk)), math.cos(math.radians(ln * nk)))); aim('Head', (0, -G.get('head', 0.06), 1.0))
            hh = G.get('head_hold', 0); set_yaw('Neck', yaw_c * (1 - hh * 0.5)); set_yaw('Head', yaw_c * (1 - hh))
        # the legs: the left strikes at u = 0, the right at u = 0.5
        for side, ph, sx in (('Left', u, 1), ('Right', (u + 0.5) % 1.0, -1)):
            hip = W(side + 'UpLeg'); a, b = LEN[side]
            ball, pitch = foot_at(ph, G, HX + sx * G['apart'])
            fv = rot_x(FOOTVEC[side], pitch); fv.x = FOOTVEC[side].x * 0.6
            ankle_t = ball - fv; knee, ankle = ik(hip, ankle_t, a, b); (print('DBG %s %s ph %.2f hip (%.3f %.3f %.3f) target (%.3f %.3f %.3f) dist %.3f reach %.3f' % (name, side, ph, hip.x, hip.y, hip.z, ankle_t.x, ankle_t.y, ankle_t.z, (ankle_t - hip).length, a + b)) if os.environ.get('GAIT_DBG') else None); MISS.append((ankle - ankle_t).length); (MISS_ST.append(((ankle - ankle_t).length, round(ph, 2))) if ph < G['beta'] else None)
            aim(side + 'UpLeg', knee - hip); aim(side + 'Leg', ankle - W(side + 'Leg'))
            aim(side + 'Foot', (ankle + fv) - W(side + 'Foot'))
            toe_dir = Vector((0.0, -1.0, -0.02)) if ph < G['beta'] else rot_x(Vector((0, -1, 0)), pitch * 0.5)
            aim(side + 'ToeBase', toe_dir)
        # the arms against the legs: the right arm forward when the left leg is (u = 0), bent at the elbow, the hands toward the middle
        al, fl = G.get('arm_lag', 0), G.get('fore_lag', 0)
        for side, sx, sg in ([] if src else (('Left', 1, -1), ('Right', -1, 1))):
            swing = sg * math.cos(2 * math.pi * (u - al)); swf = sg * math.cos(2 * math.pi * (u - al - fl))
            a_deg = G['arm'] * swing * (1.15 if swing > 0 else 0.8) - G.get('back', 6); a = math.radians(a_deg)
            fa = math.radians(a_deg + G['bend'] + G.get('fore_swing', 0) * max(0.0, swf))
            aim(side + 'Arm', (sx * 0.22, -math.sin(a), -math.cos(a)))
            aim(side + 'ForeArm', (-sx * 0.18, -math.sin(fa), -math.cos(fa)))
        key_all(k + 1)
    # check: how fast the planted ball travels over the ground through the stance, against the speed it must match
    vs = []
    for k in range(N):
        sc.frame_set(k + 1); b0 = W('LeftToeBase'); sc.frame_set(k + 2 if k + 2 <= N else 1); b1 = W('LeftToeBase')
        if (k + 1) / N <= G['beta']: vs.append(abs(b1.y - b0.y) / (G['T'] / N))     # both frames inside the stance (the push-off frame lifts the ball)
    print('GAIT %s: the legs fall short by at most %.3f m; in the stance %s' % (name, max(MISS), sorted(MISS_ST, reverse=True)[:3]))
    print('GAIT %-4s %d frames a loop of %.2f s (%.1f fps), stride %.2f m = %.1f units a loop; the planted ball moves %.2f m/s, the game moves him %.2f m/s'
          % (name, N, G['T'], N / G['T'], SPEED_M * G['T'], SPEED_M * G['T'] * UNITS_PER_M, (sum(vs) / len(vs)) if vs else 0, SPEED_M))
for name, G in GAIT.items():
    if ONLY and name not in ONLY: continue
    if G.get('demo') and not ONLY: continue
    if G.get('keep') and not (bpy.data.actions.get(name) or bpy.data.actions.get(name + '_mixamo')): print('GAIT', name, 'is not in this file'); continue
    build(name, G)
set_action(bpy.data.actions['idle']); sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT)
