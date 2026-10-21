"""The adder, modelled, rigged and animated by script (2026-10-11, after the four-legged animals: a snake needs a rig of its own).
node tools/blender.js art/build/snake_build.py

The rig is a chain of N bones from the tail (the root, at +Y) to the head (at -Y), and one small bone for the tongue. The body is
one lofted tube, flat underneath, each ring weighted between the two bones it lies on; the head, the eyes, the tongue and the dark
zigzag down the back are rigid parts on one bone each.

A clip is a function of the phase that gives every segment a heading, a rise and a roll (degrees) and says which stretch of the
body stays where it is; the segments are then laid end to end, so the snake never stretches, and each bone gets the turn from
its parent. Clips: idle (a loose S, the head a little up, the tongue flicking), walk and run (a wave travelling down the body),
windup (the front third rises and draws back into a tight S), attack (the S thrown straight forward), hit, death (it writhes,
rolls belly up and lies still). Saves art/source/snake.blend."""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'                                   # the kraken round (2026-10-21)
from mathutils import Vector, Matrix

NAME = 'snake'
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source'); OUT = os.path.abspath(os.path.join(SRC, NAME + '.blend'))
FPS = 24; rad = math.radians
N = 16; LEN = 1.5; SEG = LEN / N; RMAX = 0.084          # bigger than a real adder (0.7 m) so it reads at game scale
COL = {'body': '#b8aa88', 'belly': '#e0d6bc', 'zig': '#2c241e', 'head': '#9c8a6c', 'eye': '#d6452a', 'tongue': '#2a1512'}   # 2026-10-21: a grey-tan adder, a near-black zigzag; the red eye its one hot thing

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
body_c = bpy.data.collections.new('Body'); gear_c = bpy.data.collections.new('Gear')
sc.collection.children.link(body_c); sc.collection.children.link(gear_c)
M = {k: toon.material(NAME + '_' + k, v, None, 'cel') for k, v in COL.items()}
PARTS = []
def mesh_object(name, bm, mats, weights=None, group=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); body_c.objects.link(o)
    for m in (mats if isinstance(mats, (list, tuple)) else [mats]): me.materials.append(m)
    if group: o.vertex_groups.new(name=group).add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    else:
        for v in me.vertices:
            for g, wt in weights(v.co).items():
                if wt > 0.001: (o.vertex_groups.get(g) or o.vertex_groups.new(name=g)).add([v.index], wt, 'REPLACE')
    for p in me.polygons: p.use_smooth = True
    PARTS.append(o); return o
def ball(name, mat, group, c, r, sx=1.0, sy=1.0, sz=1.0, seg=10, rings=7):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    return mesh_object(name, bm, mat, group=group)
def cone(name, mat, group, p0, p1, r0, r1, seg=6):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg; v = Vector((math.cos(a) * r, math.sin(a) * r, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return mesh_object(name, bm, mat, group=group)

# ---------------- the rig: the tail's tip at y = LEN / 2, the neck's end at y = -LEN / 2, the head beyond ----------------
Y0 = LEN / 2; ZC = RMAX * 0.78
def radius(u):                                     # along the body, 0 the tail's tip, 1 the neck
    return RMAX * (0.10 + 0.90 * min(1.0, u / 0.45) ** 0.8) * (1.0 - 0.28 * max(0.0, (u - 0.86) / 0.14))
arm = bpy.data.armatures.new('snakeRig'); rig = bpy.data.objects.new('snakeRig', arm); sc.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT'); EB = arm.edit_bones
for i in range(N):
    b = EB.new('s%02d' % i); b.head = (0, Y0 - i * SEG, ZC); b.tail = (0, Y0 - (i + 1) * SEG, ZC)
    if i: b.parent = EB['s%02d' % (i - 1)]
HEADL = 0.19
b = EB.new('head'); b.head = (0, -Y0, ZC); b.tail = (0, -Y0 - HEADL, ZC); b.parent = EB['s%02d' % (N - 1)]
b = EB.new('tongue'); b.head = (0, -Y0 - HEADL * 0.8, ZC - 0.01); b.tail = (0, -Y0 - HEADL * 0.8 - 0.08, ZC - 0.01); b.parent = EB['head']
bpy.ops.object.mode_set(mode='OBJECT')
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'

# ---------------- the body ----------------
def bw(co):                                        # a ring between two bones' middles shares them
    f = (Y0 - co.y) / SEG - 0.5; i = int(math.floor(f)); k = f - i
    a, c = max(0, min(N - 1, i)), max(0, min(N - 1, i + 1))
    if a == c: return {'s%02d' % a: 1.0}
    return {'s%02d' % a: 1 - k, 's%02d' % c: k}
bm = bmesh.new(); RINGS = []; SEGS = 10; NR = N * 2 + 1
for j in range(NR):
    u = j / (NR - 1); y = Y0 - u * LEN; r = radius(u); ring = []
    for i in range(SEGS):
        a = 2 * math.pi * (i + 0.5) / SEGS; s = math.sin(a); k = 0.62 if s < -0.3 else 1.0          # a flat belly
        ring.append(bm.verts.new((math.cos(a) * r * 1.12, y, ZC * (r / RMAX) + s * r * 0.86 * k)))
    RINGS.append(ring)
for j in range(NR - 1):
    for i in range(SEGS):
        f = bm.faces.new((RINGS[j][i], RINGS[j][(i + 1) % SEGS], RINGS[j + 1][(i + 1) % SEGS], RINGS[j + 1][i]))
        if math.sin(2 * math.pi * (i + 1.0) / SEGS) < -0.3: f.material_index = 1
bm.faces.new(RINGS[0][::-1]); bm.faces.new(RINGS[-1])
mesh_object('body', bm, [M['body'], M['belly']], weights=bw)
# the zigzag (2026-10-21, the kraken round; it was a lozenge on each segment, left and right in turn, and read as a row of dots): one
# continuous dark band down the back from the neck to near the tail's tip, a zig every segment, lying on the body's top and bent with it
def top_z(u, x):
    r = radius(u); rx = r * 1.12; rz = r * 0.86; k = max(0.0, 1 - (x / rx) ** 2); return ZC * (r / RMAX) + rz * math.sqrt(k) + 0.004
bmz = bmesh.new(); rows = []; K = 260
for j in range(K + 1):
    u = 0.1 + 0.88 * j / K; y = Y0 - u * LEN; r = radius(u); ph = (Y0 - y) / SEG; tri = 2 * abs(2 * (ph / 2 - math.floor(ph / 2 + 0.5))) - 1   # a triangle wave, a zig a segment
    amp = r * 0.55; w = r * 0.42 * (0.6 + 0.4 * min(1.0, u / 0.3)); x = amp * tri   # bold enough to read at game size (the first, 0.40 and 0.26, vanished)
    rows.append([bmz.verts.new((x + dx, y, top_z(u, x + dx))) for dx in (-w, w)])
for (a0, b0), (a1, b1) in zip(rows, rows[1:]): bmz.faces.new((a0, b0, b1, a1))
zig = mesh_object('zigzag', bmz, M['zig'], weights=bw); sol = zig.modifiers.new('solid', 'SOLIDIFY'); sol.thickness = 0.006; sol.offset = 1.0
hy = -Y0
ball('skull', M['head'], 'head', (0, hy - HEADL * 0.50, ZC), 0.09, sx=1.0, sy=1.25, sz=0.62)                 # a broad flat head, wider than the neck
ball('snout', M['head'], 'head', (0, hy - HEADL * 0.95, ZC - 0.006), 0.055, sx=1.0, sy=1.1, sz=0.6)
ball('jaw', M['belly'], 'head', (0, hy - HEADL * 0.55, ZC - 0.032), 0.075, sx=1.0, sy=1.3, sz=0.4)
ball('vmark', M['zig'], 'head', (0, hy - HEADL * 0.30, ZC + 0.05), 0.044, sx=1.1, sy=1.4, sz=0.25, seg=8, rings=5)
for sx in (1, -1): ball('eye%d' % sx, M['eye'], 'head', (sx * 0.064, hy - HEADL * 0.72, ZC + 0.026), 0.021)
t0 = Vector((0, hy - HEADL * 1.15, ZC - 0.012))
cone('tongueA', M['tongue'], 'tongue', t0 + Vector((0, 0.06, 0)), t0 + Vector((0, -0.03, 0)), 0.009, 0.007, seg=5)
for sx in (1, -1): cone('tongueF%d' % sx, M['tongue'], 'tongue', t0 + Vector((0, -0.03, 0)), t0 + Vector((sx * 0.018, -0.065, 0)), 0.007, 0.002, seg=5)
for o in PARTS:
    md = o.modifiers.new('rig', 'ARMATURE'); md.object = rig; o.parent = rig

# ---------------- posing ----------------
REST = {b.name: b.matrix_local.to_3x3() for b in arm.bones}
RX = lambda d: Matrix.Rotation(rad(d), 3, 'X'); RY = lambda d: Matrix.Rotation(rad(d), 3, 'Y'); RZ = lambda d: Matrix.Rotation(rad(d), 3, 'Z')
def set_rot(name, R3, frame):
    pb = rig.pose.bones[name]; B = REST[name]; pb.rotation_quaternion = (B.inverted() @ R3 @ B).to_quaternion(); pb.keyframe_insert('rotation_quaternion', frame=frame)
def pose(frame, P):
    """P: yaw(i), up(i), roll(i) in degrees for segment i (0 the tail, N the head); hold: (i0, i1) the stretch of joints whose
    middle stays where it lies at rest; at (x, y) moves that; tongue: 0 in .. 1 out"""
    yaw, up, roll = P.get('yaw', lambda i: 0.0), P.get('up', lambda i: 0.0), P.get('roll', lambda i: 0.0)
    D = [RZ(yaw(i)) @ RX(-up(i)) @ RY(roll(i)) for i in range(N + 1)]
    pts = [Vector((0, 0, 0))]
    for i in range(N): pts.append(pts[-1] + D[i] @ Vector((0, -SEG, 0)))
    i0, i1 = P.get('hold', (0, N)); mid = Vector((0, 0, 0))
    for q in pts[i0:i1 + 1]: mid += q
    mid /= (i1 - i0 + 1); rest_mid = Vector((0, -((i0 + i1) / 2.0) * SEG, 0)); at = P.get('at', (0, 0))
    lowest = min(q.z for q in pts)                                                        # nothing sinks into the ground
    off = Vector((at[0] + rest_mid.x - mid.x, at[1] + rest_mid.y - mid.y, -lowest))
    pb = rig.pose.bones['s00']; pb.location = REST['s00'].inverted() @ off; pb.keyframe_insert('location', frame=frame)
    for i in range(N + 1):
        set_rot('s%02d' % i if i < N else 'head', D[i] if i == 0 else D[i - 1].inverted() @ D[i], frame)
    tb = rig.pose.bones['tongue']; tb.location = (0, (P.get('tongue', 0.0) - 1.0) * 0.07, 0); tb.keyframe_insert('location', frame=frame)
def clip(name, length, fn):
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = length
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    for f in range(1, length + 1): pose(f, fn((f - 1) / length))
    return act
TAU = 2 * math.pi
def wave(A, waves, ph):
    """headings for a wave along the body; the mean is taken out so the snake still points the way it faces"""
    raw = [A * math.sin(TAU * (waves * i / N) - ph) * (0.35 + 0.65 * math.sin(math.pi * min(1.0, i / (N * 0.8)))) for i in range(N + 1)]
    m = sum(raw[:N]) / N; return [v - m for v in raw]
def flick(p, t0):                                   # the tongue out and in, starting at t0
    u = (p - t0) / 0.22; return max(0.0, math.sin(TAU * u)) if 0 <= u <= 1 else 0.0
def head_up(i, k, n=4):                             # the last n segments rise and the head levels again
    j = i - (N - n)
    if j < 0: return 0.0
    return (k * (1.0 if j < n - 1 else 0.25)) if i < N else -k * 0.6
def idle(p):
    w = wave(46, 1.25, 0.6 + 0.10 * math.sin(TAU * p)); s = math.sin(TAU * p)
    return {'yaw': lambda i: w[i] + (4 * s if i > N - 4 else 0), 'up': lambda i: head_up(i, 14 + 3 * s), 'tongue': max(flick(p, 0.12), flick(p, 0.62))}
def slither(A, waves, k):
    def f(p):
        w = wave(A, waves, TAU * p)
        return {'yaw': lambda i: w[i] if i < N else -w[N - 1] * 0.8, 'up': lambda i: head_up(i, k, 3), 'tongue': flick(p, 0.3)}
    return f
REAR_YAW = (0, 48, 30, -42, -40, 4, 0); REAR_UP = (30, 46, 40, 20, -4, -30, -50)
def coil(k):                                        # the striking S: the hind body curls, the front third stands up and folds back
    loose = lambda i: 46 * math.sin(TAU * 1.25 * i / N - 0.6)
    def yaw(i):
        if i < N - 6: return 62 * k * math.sin(TAU * i / (N - 6) + 0.4) + (1 - k) * loose(i)
        return REAR_YAW[i - (N - 6)] * k + (1 - k) * loose(i)
    def up(i):
        j = i - (N - 6)
        if j < 0: return 0.0
        return REAR_UP[j] * k + (1 - k) * head_up(i, 14)
    return yaw, up
def windup(p):
    k = 0.5 - 0.5 * math.cos(math.pi * min(1.0, p * 1.5)); yaw, up = coil(k); sway = 5 * math.sin(TAU * 2 * p) * k
    return {'yaw': lambda i: yaw(i) + (sway if i >= N - 5 else 0), 'up': up, 'hold': (0, N - 6), 'tongue': flick(p, 0.5)}
def attack(p):
    if p < 0.30: k = 1 - (p / 0.30) ** 0.6                                   # thrown straight
    elif p < 0.50: k = 0.0
    else: k = 0.55 * (0.5 - 0.5 * math.cos(math.pi * (p - 0.5) / 0.5))       # drawn back, half coiled
    yaw, up = coil(k); s = 1 - k
    return {'yaw': lambda i: yaw(i) * ((1 - 0.75 * s) if i < N - 6 else 1), 'up': lambda i: up(i) + (6 * s if N - 6 <= i < N else 0), 'hold': (0, 4)}
def hit(p):
    k = math.sin(math.pi * p); w = wave(46 + 30 * k, 1.25, 0.6 + 1.4 * k)
    return {'yaw': lambda i: w[i], 'up': lambda i: head_up(i, 14 + 26 * k), 'at': (0, 0.07 * k)}
def death(p):
    wr = max(0.0, 1 - p / 0.6); f = min(1.0, max(0.0, (p - 0.25) / 0.5)); f = f * f * (3 - 2 * f)
    w = wave(46 + 34 * wr * math.sin(TAU * 2.2 * p), 1.25, 0.6 + 2.6 * min(p, 0.6))
    return {'yaw': lambda i: w[i], 'up': lambda i: head_up(i, 14 * (1 - f) + 30 * wr * abs(math.sin(TAU * 1.5 * p))), 'roll': lambda i: 172 * f * min(1.0, 0.35 + i / (N * 0.5))}
clip('idle', 48, idle); clip('walk', 24, slither(50, 1.5, 8)); clip('run', 12, slither(62, 1.5, 12)); clip('windup', 14, windup); clip('attack', 12, attack); clip('hit', 8, hit); clip('death', 20, death)
ad = rig.animation_data; ad.action = bpy.data.actions['idle']
if hasattr(ad, 'action_slot') and len(ad.action.slots): ad.action_slot = ad.action.slots[0]
sc.frame_set(1)
os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, 'parts', len(PARTS), 'actions', sorted(a.name for a in bpy.data.actions))
