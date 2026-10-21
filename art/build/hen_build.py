"""The hen, modelled, rigged and animated by script (2026-10-20, the studio; the villages plan step 5, Robin's first animal with the
goat). A small bird on the beasts' conventions (quad_build.py): it faces -Y, up is Z, its left is +X; rigid parts on one bone each,
a rotation about a world axis made a bone's own by conjugating with its rest matrix; the clips baked every frame from functions of
the phase. No solver: a hen's legs are short and the feet need not stay planted to the pixel at this size.
  node tools/blender.js hen_build.py [-- rooster]
Rig: body (bob, pitch, roll, yaw), neck, head, tail, wingL, wingR, thighL, shankL, footL, thighR, shankR, footR.
Clips (the developer's list, 2026-10-20): idle, walk, run (the flee), peck, sit (the dust bath; the last frame is the sitting hen),
hit, death. Saves source/hen.blend (or rooster.blend)."""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'                                   # the kraken round (2026-10-21): chosen tones
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
NAME = argv[0] if argv else 'hen'
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source'); OUT = os.path.abspath(os.path.join(SRC, NAME + '.blend'))
FPS = 24; rad = math.radians; TWO = 2 * math.pi
ROOSTER = NAME == 'rooster'
COL = {'body': '#c47c48' if not ROOSTER else '#9a5232', 'wing': '#ad6c44' if not ROOSTER else '#d49a44', 'tail': '#6a4a36' if not ROOSTER else '#2e3a34', 'neck': '#dba274' if not ROOSTER else '#e2b45a', 'comb': '#c0392b', 'beak': '#e2c27a', 'leg': '#d4b46a', 'eye': '#120e0c', 'belly': '#dcb48c'}   # light, so the ink line does not swallow a small bird

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
body_c = bpy.data.collections.new('Body'); gear_c = bpy.data.collections.new('Gear'); sc.collection.children.link(body_c); sc.collection.children.link(gear_c)
M = {k: toon.material(NAME + '_' + k, v, None, 'cel') for k, v in COL.items()}
PARTS = []
def mesh_object(name, bm, mat, group, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); body_c.objects.link(o); me.materials.append(mat)
    o.vertex_groups.new(name=group).add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    for p in me.polygons: p.use_smooth = smooth
    PARTS.append(o); return o
def cone(name, mat, group, p0, p1, r0, r1, seg=10, sx=1.0, sy=1.0):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg): a = TWO * (i + 0.5) / seg; v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1]); return mesh_object(name, bm, mat, group)
def ball(name, mat, group, c, r, sx=1.0, sy=1.0, sz=1.0, seg=10, rings=7, rot=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        p = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
        if rot: p.rotate(rot)
        v.co = p + Vector(c)
    return mesh_object(name, bm, mat, group)

# ---------------- the rig ----------------
B = (0, 0.0, 0.21)                                   # the body's centre: a hen stands 0.38 m to the top of the comb
HIP = {'L': (0.035, 0.02, 0.17), 'R': (-0.035, 0.02, 0.17)}; KNEE = {'L': (0.04, 0.045, 0.10), 'R': (-0.04, 0.045, 0.10)}; ANK = {'L': (0.04, -0.005, 0.045), 'R': (-0.04, -0.005, 0.045)}; FOOT = {'L': (0.04, -0.03, 0.0), 'R': (-0.04, -0.03, 0.0)}
arm = bpy.data.armatures.new(NAME + 'Rig'); rig = bpy.data.objects.new(NAME + 'Rig', arm); sc.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT'); EB = arm.edit_bones
def bone(name, head, tail, parent=None):
    b = EB.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = EB[parent]
    return b
bone('root', (0, 0, 0), (0, 0.1, 0)); bone('body', B, (B[0], B[1], B[2] + 0.1), 'root')
bone('neck', (0, -0.07, 0.26), (0, -0.11, 0.34), 'body'); bone('head', (0, -0.11, 0.34), (0, -0.15, 0.35), 'neck')
bone('tail', (0, 0.08, 0.25), (0, 0.16, 0.32), 'body')
for s in ('L', 'R'):
    x = 0.07 if s == 'L' else -0.07
    bone('wing' + s, (x * 0.6, -0.01, 0.25), (x, 0.02, 0.22), 'body')
    bone('thigh' + s, HIP[s], KNEE[s], 'body'); bone('shank' + s, KNEE[s], ANK[s], 'thigh' + s); bone('foot' + s, ANK[s], FOOT[s], 'shank' + s)
bpy.ops.object.mode_set(mode='OBJECT')
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'

# ---------------- the body ----------------
C = M
ball('body', C['body'], 'body', B, 0.085, sx=0.8, sy=1.15, sz=0.85, rot=Matrix.Rotation(rad(-12), 3, 'X'))           # the egg of the body, its back rising to the tail
ball('breast', C['belly'], 'body', (0, -0.05, 0.17), 0.055, sx=0.85, sy=0.9, sz=0.8)
ball('rump', C['body'], 'body', (0, 0.07, 0.24), 0.05, sx=0.7, sy=0.9, sz=0.8)
for s, x in (('L', 0.065), ('R', -0.065)): ball('wing' + s, C['wing'], 'wing' + s, (x, 0.0, 0.23), 0.07, sx=0.35, sy=1.1, sz=0.6, rot=Matrix.Rotation(rad(-10), 3, 'X'))
for k, (dy, dz, sx_) in enumerate(((0.0, 0.0, 0.0), (0.015, -0.008, 0.012), (0.015, -0.008, -0.012), (0.025, -0.02, 0.026), (0.025, -0.02, -0.026))):   # the tail: a small fan of flat feathers up and back
    cone('tail%d' % k, C['tail'], 'tail', (sx_ * 0.5, 0.09 + dy, 0.25 + dz), (sx_ * 1.8, 0.145 + dy * 1.2, 0.31 + dz * 1.5 - abs(sx_) * 0.3), 0.009, 0.016, seg=6, sx=1.0, sy=0.3)
cone('neck', C['neck'], 'neck', (0, -0.05, 0.25), (0, -0.11, 0.345), 0.035, 0.024, seg=8)
ball('head', C['neck'], 'head', (0, -0.12, 0.35), 0.034, sy=1.1)
cone('beak', C['beak'], 'head', (0, -0.148, 0.345), (0, -0.19, 0.335), 0.013, 0.003, seg=6, sy=0.8)
for k in range(3 if not ROOSTER else 4): cone('comb%d' % k, C['comb'], 'head', (0, -0.135 + k * 0.016, 0.375), (0, -0.14 + k * 0.016, 0.395 + (0.01 if k == 1 else 0) + (0.02 if ROOSTER else 0)), 0.009, 0.003, seg=5, sx=0.4)
ball('wattle', C['comb'], 'head', (0, -0.145, 0.322), 0.011, sz=1.4)
for sx in (1, -1): ball('eye' + ('L' if sx > 0 else 'R'), C['eye'], 'head', (sx * 0.026, -0.128, 0.355), 0.006)
for s in ('L', 'R'):
    cone('thigh' + s, C['body'], 'thigh' + s, HIP[s], KNEE[s], 0.03, 0.02, seg=7)                                                        # the thigh under the feathers
    cone('shank' + s, C['leg'], 'shank' + s, KNEE[s], ANK[s], 0.009, 0.007, seg=6)
    for a in (-0.6, 0.0, 0.6): cone('toe' + s + str(int(a * 10)), C['leg'], 'foot' + s, ANK[s], (ANK[s][0] + math.sin(a) * 0.035, ANK[s][1] - math.cos(a) * 0.045, 0.004), 0.006, 0.003, seg=5)
    cone('hind' + s, C['leg'], 'foot' + s, ANK[s], (ANK[s][0], ANK[s][1] + 0.02, 0.004), 0.005, 0.003, seg=5)
for o in PARTS: md = o.modifiers.new('rig', 'ARMATURE'); md.object = rig; o.parent = rig

# ---------------- posing ----------------
REST = {b.name: b.matrix_local.to_3x3() for b in arm.bones}
RX = lambda d: Matrix.Rotation(rad(d), 3, 'X'); RY = lambda d: Matrix.Rotation(rad(d), 3, 'Y'); RZ = lambda d: Matrix.Rotation(rad(d), 3, 'Z')
def set_rot(name, R3, frame):
    pb = rig.pose.bones[name]; Bm = REST[name]; pb.rotation_quaternion = (Bm.inverted() @ R3 @ Bm).to_quaternion(); pb.keyframe_insert('rotation_quaternion', frame=frame)
def pose(frame, P):
    """P: loc, pitch (beak down positive), roll, yaw; neck, head (pitch), head_yaw; tail (up positive); wings (out, degrees); legs: {L: (thigh, shank, foot) degrees forward positive}"""
    g = P.get; loc = Vector(g('loc', (0, 0, 0))); Rb = RZ(g('yaw', 0.0)) @ RY(g('roll', 0.0)) @ RX(g('pitch', 0.0))
    pb = rig.pose.bones['body']; pb.location = REST['body'].inverted() @ loc; pb.keyframe_insert('location', frame=frame); set_rot('body', Rb, frame)
    set_rot('neck', RZ(g('neck_yaw', 0.0)) @ RX(g('neck', 0.0)), frame); set_rot('head', RZ(g('head_yaw', 0.0)) @ RY(g('head_roll', 0.0)) @ RX(g('head', 0.0)), frame)
    set_rot('tail', RX(-g('tail', 0.0)), frame)
    w = g('wings', 0.0); set_rot('wingL', RY(-w), frame); set_rot('wingR', RY(w), frame)
    legs = g('legs', {})
    for s in ('L', 'R'):
        t, sh, ft = legs.get(s, (0.0, 0.0, 0.0)); set_rot('thigh' + s, RX(-t), frame); set_rot('shank' + s, RX(-sh), frame); set_rot('foot' + s, RX(-ft), frame)
def clip(name, length, fn):
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = length
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    for f in range(1, length + 1): pose(f, fn((f - 1) / length))
    return act

# ---------------- the clips ----------------
def stepleg(u, lift=1.0):                           # one leg through a step: u in 0..1; the thigh swings, the shank folds in the swing, the foot points
    u = u % 1.0
    if u < 0.55: k = u / 0.55; return (18 - 36 * k, 4, 6 - 8 * k)                                   # the stance: the leg swings back under the body
    v = (u - 0.55) / 0.45; sw = math.sin(math.pi * v); return (-18 + 36 * v, -40 * sw * lift + 4, 25 * sw * lift)   # the swing: lifted and carried forward
def idle(p):
    w = TWO * p; look = math.sin(w) ** 3
    return {'loc': (0, 0, -0.003 * (0.5 - 0.5 * math.cos(2 * w))), 'neck': 4 * math.sin(2 * w), 'head': 6 * math.sin(2 * w + 1) - 4, 'head_yaw': 30 * look, 'neck_yaw': 12 * look, 'tail': 6 * math.sin(w), 'wings': 2 * max(0, math.sin(3 * w))}
def walk(p):
    w = TWO * p; bob = 0.006 * (0.5 - 0.5 * math.cos(2 * w)); jerk = math.sin(2 * w)                 # the head goes forward with each step and holds while the body catches up
    return {'loc': (0, 0, -bob), 'pitch': 2 * math.sin(2 * w), 'roll': 4 * math.sin(w), 'neck': 10 + 12 * jerk, 'head': -14 * jerk - 4, 'tail': 5 * math.sin(2 * w), 'legs': {'L': stepleg(p), 'R': stepleg(p + 0.5)}}
def run(p):
    w = TWO * p; bob = 0.012 * (0.5 - 0.5 * math.cos(2 * w))
    return {'loc': (0, -0.01, -bob + 0.005), 'pitch': 12 + 3 * math.sin(2 * w), 'roll': 5 * math.sin(w), 'neck': 28 + 10 * math.sin(2 * w), 'head': -26 - 6 * math.sin(2 * w), 'tail': 10 + 6 * math.sin(2 * w), 'wings': 38 + 12 * math.sin(4 * w), 'legs': {'L': stepleg(p, 1.3), 'R': stepleg(p + 0.5, 1.3)}}
def peck(p):
    u = (3 * p) % 1.0; d = math.sin(math.pi * min(1.0, u * 1.25)) if u < 0.8 else 0.0; d = d * d        # three pecks: down fast, a beat on the ground, up
    return {'loc': (0, -0.01 * d, -0.01 * d), 'pitch': 14 * d, 'neck': 48 * d, 'head': 30 * d, 'head_yaw': 6 * math.sin(TWO * p), 'tail': 14 * d, 'legs': {'L': (6 * d, 4, 0), 'R': (6 * d, 4, 0)}}
def sit(p):
    k = p * p * (3 - 2 * p); sh = 0.5 - 0.5 * math.cos(TWO * 3 * p) if p > 0.6 else 0.0           # settles, then a shuffle of the dust bath; the last frame is the sitting hen
    return {'loc': (0, 0.0, -0.11 * k), 'pitch': -4 * k + 3 * sh, 'roll': 6 * sh * math.sin(TWO * 2 * p), 'neck': -6 * k, 'head': 4 * k, 'head_yaw': 20 * k * math.sin(TWO * p), 'tail': -8 * k, 'wings': 14 * sh, 'legs': {'L': (60 * k, -110 * k, 40 * k), 'R': (60 * k, -110 * k, 40 * k)}}
def hit(p):
    k = math.sin(math.pi * min(1.0, p * 1.3)) * (1 - 0.3 * p)
    return {'loc': (0, 0.03 * k, 0.01 * k), 'pitch': -10 * k, 'roll': 8 * k, 'neck': -10 * k, 'head_yaw': 20 * k, 'wings': 40 * k, 'tail': 20 * k}
def death(p):
    a = min(1.0, p / 0.25); flap = math.sin(math.pi * a) * (1 - min(1.0, p / 0.35)); f = min(1.0, max(0.0, (p - 0.15) / 0.5)); f = f * f * (3 - 2 * f)
    return {'loc': (0.03 * f, 0.01 * flap, -0.13 * f), 'roll': 88 * f, 'pitch': -6 * flap, 'neck': -10 * f, 'head': 12 * f, 'head_yaw': -20 * f, 'tail': 10 * f, 'wings': 60 * flap + 25 * f, 'legs': {'L': (20 * f, 10 * f, 20 * f), 'R': (-10 * f, 30 * f, 10 * f)}}

clip('idle', 48, idle); clip('walk', 16, walk); clip('run', 10, run); clip('peck', 24, peck); clip('sit', 24, sit); clip('hit', 8, hit); clip('death', 16, death)
ad = rig.animation_data; ad.action = bpy.data.actions['idle']
if hasattr(ad, 'action_slot') and len(ad.action.slots): ad.action_slot = ad.action.slots[0]
sc.frame_set(1)
os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, 'parts', len(PARTS), 'actions', sorted(a.name for a in bpy.data.actions))
