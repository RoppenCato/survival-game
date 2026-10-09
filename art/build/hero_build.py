"""The hero, built from scratch for Blender (2026-10-09, Robin: a trial of Blender for characters). A low-poly figure in the art
direction, about five and a half heads, lean and long, made of simple shapes with a strong silhouette so it reads at sprite size:
a small egg of a head with hair tied back in a tail and a short beard, a belted tunic to mid-thigh, trousers, boots, and the one
hot accent, a red cloak pinned at the left shoulder and hanging down the back. Rigid parts on a basic rig (each part is one
vertex group on one bone), an idle and a walk, and two gear pieces as separate meshes in the Gear collection: a nasal helmet
on the head and a mail shirt on the chest. Saves art/source/hero.blend.

  blender -b -P art/build/hero_build.py            (the runner tools/blender.js does this)
"""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source', 'hero.blend')
FPS = 24

# ---- the palette: earth and bone; the cloak is the one colour allowed to burn ----
COL = {
    'skin': '#e3bf98', 'hair': '#8e4a28', 'beard': '#7a3f22', 'ink': '#231a16',
    'tunic': '#a8977a', 'sleeve': '#a8977a', 'belt': '#5a3d2a', 'buckle': '#c99a3a',
    'pants': '#4e5666', 'boot': '#3e2c24', 'cloak': '#8a3a34', 'brooch': '#c99a3a',
    'iron': '#9c9d9a', 'ironD': '#72736f', 'leather': '#6a4a32',
}

# ---- proportions: the ink figure's INK_BASE (47 units tall) in metres, 1.8 m tall ----
U = 1.8 / 47.0
FOOT, LEG, TORSO, HEAD = 1.8 * U, 20.5 * U, 14.0 * U, 9.2 * U
ANKLE = FOOT; HIP = ANKLE + LEG; SH = HIP + TORSO; CHIN = SH + 1.4 * U; TOP = CHIN + HEAD
SHW, HIPW = 5.1 * U, 3.8 * U                     # half widths
ARM = 7.7 * U                                     # one arm segment

def _link(o, coll):
    coll.objects.link(o); return o

def mesh_object(name, bm, coll, mat, group):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); _link(o, coll)
    me.materials.append(mat)
    vg = o.vertex_groups.new(name=group); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    for p in me.polygons: p.use_smooth = True
    return o

def cone(name, coll, mat, group, p0, p1, r0, r1, seg=8, sx=1.0, sy=1.0, smooth=True):
    """A tapered tube from p0 (radius r0) to p1 (radius r1), capped; sx, sy squash the section."""
    bm = bmesh.new()
    p0, p1 = Vector(p0), Vector(p1); axis = (p1 - p0); L = axis.length; axis.normalize()
    q = axis.to_track_quat('Z', 'Y')
    rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg
            v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q)
            ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg):
        bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    o = mesh_object(name, bm, coll, mat, group)
    if not smooth:
        for p in o.data.polygons: p.use_smooth = False
    return o

def ball(name, coll, mat, group, c, r, seg=10, rings=7, sx=1.0, sy=1.0, sz=1.0):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    return mesh_object(name, bm, coll, mat, group)

def cap(name, coll, mat, group, c, r, plane_point, plane_normal, seg=10, rings=7, sx=1.0, sy=1.0, sz=1.0):
    """A sphere with everything on the far side of a plane cut away (hair, a helmet's bowl)."""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=Vector(plane_point), plane_no=Vector(plane_normal).normalized(), clear_inner=True)
    return mesh_object(name, bm, coll, mat, group)

def box(name, coll, mat, group, c, size, smooth=False):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(c)
    o = mesh_object(name, bm, coll, mat, group)
    if not smooth:
        for p in o.data.polygons: p.use_smooth = False
    return o

def wedge(name, coll, mat, group, quads):
    """A closed shape from a list of 4-point rings (bottom to top), like a lofted strip."""
    bm = bmesh.new(); rings = [[bm.verts.new(Vector(p)) for p in ring] for ring in quads]
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    o = mesh_object(name, bm, coll, mat, group)
    for p in o.data.polygons: p.use_smooth = False
    return o

# ---- the scene ----
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
body_c = bpy.data.collections.new('Body'); gear_c = bpy.data.collections.new('Gear')
sc.collection.children.link(body_c); sc.collection.children.link(gear_c)
M = {k: toon.material(k, v) for k, v in COL.items()}

# ---- the rig ----
arm_data = bpy.data.armatures.new('HeroRig'); rig = bpy.data.objects.new('HeroRig', arm_data); sc.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
EB = arm_data.edit_bones
def bone(name, head, tail, parent=None, connect=False):
    b = EB.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = EB[parent]; b.use_connect = connect
    return b
bone('root', (0, 0, 0), (0, 0.25, 0))
bone('hips', (0, 0, HIP), (0, 0, HIP + 0.14), 'root')
bone('spine', (0, 0, HIP + 0.14), (0, 0, HIP + 0.33), 'hips', True)
bone('chest', (0, 0, HIP + 0.33), (0, 0, SH), 'spine', True)
bone('neck', (0, 0, SH), (0, 0, CHIN), 'chest', True)
bone('head', (0, 0, CHIN), (0, 0, TOP), 'neck', True)
for s, sx in (('L', 1), ('R', -1)):
    bone('upper_arm.' + s, (sx * SHW, 0, SH - 0.03), (sx * (SHW + 0.02), 0, SH - 0.03 - ARM), 'chest')
    bone('forearm.' + s, (sx * (SHW + 0.02), 0, SH - 0.03 - ARM), (sx * (SHW + 0.04), 0, SH - 0.03 - 2 * ARM), 'upper_arm.' + s, True)
    bone('hand.' + s, (sx * (SHW + 0.04), 0, SH - 0.03 - 2 * ARM), (sx * (SHW + 0.045), 0, SH - 0.03 - 2 * ARM - 0.07), 'forearm.' + s, True)
    bone('thigh.' + s, (sx * HIPW * 0.6, 0, HIP), (sx * HIPW * 0.6, 0, HIP - LEG * 0.52), 'hips')
    bone('shin.' + s, (sx * HIPW * 0.6, 0, HIP - LEG * 0.52), (sx * HIPW * 0.6, 0, ANKLE), 'thigh.' + s, True)
    bone('foot.' + s, (sx * HIPW * 0.6, 0, ANKLE), (sx * HIPW * 0.6, -0.17, 0.0), 'shin.' + s, True)
bpy.ops.object.mode_set(mode='OBJECT')
for pb in rig.pose.bones: pb.rotation_mode = 'XYZ'

# ---- the body ----
P = []
def part(o):
    P.append(o); return o
x = HIPW * 0.6
# the tunic: chest to the belt, then the skirt to mid-thigh, a little flare; the sleeves are the tunic's colour
part(cone('chest', body_c, M['tunic'], 'chest', (0, 0, HIP + 0.1), (0, 0, SH + 0.01), HIPW * 1.3, SHW * 1.0, 8, 1.0, 0.66))
part(cone('skirt', body_c, M['tunic'], 'hips', (0, 0, HIP - 0.24), (0, 0, HIP + 0.1), HIPW * 1.42, HIPW * 1.3, 8, 1.0, 0.72))
part(cone('belt', body_c, M['belt'], 'hips', (0, 0, HIP + 0.075), (0, 0, HIP + 0.125), HIPW * 1.36, HIPW * 1.34, 8, 1.0, 0.74))
part(box('buckle', body_c, M['buckle'], 'hips', (0, -HIPW * 0.98, HIP + 0.1), (0.045, 0.02, 0.04)))
part(cone('neck', body_c, M['skin'], 'neck', (0, 0, SH - 0.02), (0, 0, CHIN + 0.03), 0.045, 0.045, 8))
# the head: an egg, the hair a cap set back on it with a tail, a short beard, two dot eyes and brows, a nose
hz = CHIN + HEAD * 0.5
part(ball('head', body_c, M['skin'], 'head', (0, 0, hz), HEAD * 0.5, 10, 8, 0.80, 0.86, 1.0))
part(cap('hair', body_c, M['hair'], 'head', (0, 0.012, hz + 0.02), HEAD * 0.5, (0, -0.15, hz + 0.075), (0, 0.7, 1), 10, 8, 0.92, 1.02, 1.0))
part(cone('tail', body_c, M['hair'], 'head', (0, 0.14, hz + 0.0), (0, 0.185, hz - 0.17), 0.045, 0.022, 6))
part(wedge('beard', body_c, M['beard'], 'head', [
    [(-0.04, -0.11, CHIN + 0.01), (0.04, -0.11, CHIN + 0.01), (0.035, -0.05, CHIN + 0.015), (-0.035, -0.05, CHIN + 0.015)],
    [(-0.115, -0.115, hz - 0.045), (0.115, -0.115, hz - 0.045), (0.12, 0.0, hz - 0.03), (-0.12, 0.0, hz - 0.03)]]))
for sx in (1, -1):
    part(ball('eye' + ('L' if sx > 0 else 'R'), body_c, M['ink'], 'head', (sx * 0.05, -0.138, hz + 0.015), 0.014, 6, 4))
    part(box('brow' + ('L' if sx > 0 else 'R'), body_c, M['beard'], 'head', (sx * 0.052, -0.138, hz + 0.045), (0.045, 0.016, 0.012)))
part(cone('nose', body_c, M['skin'], 'head', (0, -0.12, hz + 0.0), (0, -0.168, hz - 0.03), 0.022, 0.011, 6))
# arms and hands
for s, sx in (('L', 1), ('R', -1)):
    a0 = Vector((sx * SHW, 0, SH - 0.03)); a1 = Vector((sx * (SHW + 0.02), 0, SH - 0.03 - ARM)); a2 = Vector((sx * (SHW + 0.04), 0, SH - 0.03 - 2 * ARM))
    part(cone('upper_arm.' + s, body_c, M['sleeve'], 'upper_arm.' + s, a0 + Vector((0, 0, 0.03)), a1, 0.058, 0.048, 8))
    part(cone('forearm.' + s, body_c, M['sleeve'], 'forearm.' + s, a1, a2 + Vector((0, 0, 0.02)), 0.048, 0.04, 8))
    part(ball('hand.' + s, body_c, M['skin'], 'hand.' + s, a2 + Vector((0, 0, -0.03)), 0.042, 8, 6, 1.0, 0.8, 1.15))
# legs, boots, feet
for s, sx in (('L', 1), ('R', -1)):
    k = HIP - LEG * 0.52
    part(cone('thigh.' + s, body_c, M['pants'], 'thigh.' + s, (sx * x, 0, HIP + 0.02), (sx * x, 0, k), 0.078, 0.062, 8))
    part(cone('shin.' + s, body_c, M['pants'], 'shin.' + s, (sx * x, 0, k + 0.01), (sx * x, 0, ANKLE + 0.14), 0.062, 0.052, 8))
    part(cone('boot.' + s, body_c, M['boot'], 'shin.' + s, (sx * x, 0, ANKLE - 0.01), (sx * x, 0, ANKLE + 0.15), 0.064, 0.06, 8))
    part(wedge('foot.' + s, body_c, M['boot'], 'foot.' + s, [
        [(sx * x - 0.05, 0.05, 0.0), (sx * x + 0.05, 0.05, 0.0), (sx * x + 0.045, -0.17, 0.0), (sx * x - 0.045, -0.17, 0.0)],
        [(sx * x - 0.055, 0.06, ANKLE + 0.02), (sx * x + 0.055, 0.06, ANKLE + 0.02), (sx * x + 0.04, -0.15, 0.035), (sx * x - 0.04, -0.15, 0.035)]]))
# the cloak: pinned at the left shoulder, hanging down the back and over the left side, flaring to the calf
cz0, cz1 = SH + 0.02, HIP - LEG * 0.62
part(wedge('cloak', body_c, M['cloak'], 'chest', [
    [(-0.16, 0.10, cz1), (0.30, 0.10, cz1), (0.30, 0.16, cz1), (-0.16, 0.16, cz1)],
    [(-0.05, 0.075, HIP + 0.1), (0.24, 0.075, HIP + 0.1), (0.24, 0.13, HIP + 0.1), (-0.05, 0.13, HIP + 0.1)],
    [(0.04, 0.05, cz0), (SHW + 0.06, 0.05, cz0), (SHW + 0.06, 0.10, cz0), (0.04, 0.10, cz0)]]))
part(ball('brooch', body_c, M['brooch'], 'chest', (SHW * 0.72, -0.075, SH - 0.01), 0.035, 8, 4, 1.0, 0.5, 1.0))

# ---- gear: a nasal helmet on the head, a mail shirt on the chest (separate meshes, rendered as their own layers) ----
G = []
G.append(cap('helm', gear_c, M['iron'], 'head', (0, 0.008, hz + 0.045), HEAD * 0.5, (0, 0, hz + 0.04), (0, 0, 1), 12, 8, 0.97, 1.0, 0.98))
G.append(cone('helm_brim', gear_c, M['ironD'], 'head', (0, 0.008, hz + 0.02), (0, 0.008, hz + 0.055), HEAD * 0.5 * 0.99, HEAD * 0.5 * 0.99, 12, 0.98, 1.01))
G.append(box('nasal', gear_c, M['ironD'], 'head', (0, -0.172, hz - 0.01), (0.028, 0.022, 0.11)))
G.append(cone('helm_spike', gear_c, M['ironD'], 'head', (0, 0.012, hz + 0.21), (0, 0.012, hz + 0.26), 0.02, 0.005, 6))
G.append(cone('mail', gear_c, M['iron'], 'chest', (0, 0, HIP + 0.1), (0, 0, SH + 0.015), HIPW * 1.3 + 0.014, SHW * 1.0 + 0.014, 8, 1.0, 0.68))
G.append(cone('mail_skirt', gear_c, M['iron'], 'hips', (0, 0, HIP - 0.16), (0, 0, HIP + 0.1), HIPW * 1.4 + 0.014, HIPW * 1.3 + 0.014, 8, 1.0, 0.74))
for s, sx in (('L', 1), ('R', -1)):
    a0 = Vector((sx * SHW, 0, SH - 0.03)); a1 = Vector((sx * (SHW + 0.02), 0, SH - 0.03 - ARM))
    G.append(cone('mail_sleeve.' + s, gear_c, M['iron'], 'upper_arm.' + s, a0 + Vector((0, 0, 0.035)), a0 + (a1 - a0) * 0.55, 0.07, 0.06, 8))

# ---- bind every part to the rig with an armature modifier ----
for o in P + G:
    o.parent = rig
    md = o.modifiers.new('Rig', 'ARMATURE'); md.object = rig

# ---- animation helpers ----
def act_new(name, length):
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = length; return act

def set_action(act):
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]

LIMB = ('upper_arm', 'forearm', 'hand', 'thigh', 'shin', 'foot')
def key(frame, rots, loc=None):
    """rots: bone -> (forward, twist, outward) in degrees: +forward swings the bone's tail toward where the figure faces (a lean
    for the spine and head, a kick or a reach for a limb), +outward swings it away from the body's middle (for the spine: a sway
    toward the figure's left). Converted to Blender's local axes as art/build/probe.py measured them: on the hanging limbs +X
    swings backward, on the upright spine +X swings forward, and +Z moves every tail toward world -X. loc: the hips' offset
    (x, y, z) in metres (the hips bone points up: its local y is world z)."""
    for b, (fwd, tw, outw) in rots.items():
        limb = b.split('.')[0] in LIMB; left = b.endswith('.L')
        rx = -fwd if limb else fwd
        rz = -outw if (not limb or left) else outw
        pb = rig.pose.bones[b]; pb.rotation_euler = (math.radians(rx), math.radians(tw), math.radians(rz)); pb.keyframe_insert('rotation_euler', frame=frame)
    if loc is not None:
        pb = rig.pose.bones['hips']; pb.location = (loc[0], loc[2], -loc[1]); pb.keyframe_insert('location', frame=frame)

def walk(length=24, steps=8):
    act = act_new('walk', length); set_action(act)
    for i in range(steps + 1):
        f = 1 + i * length / steps; p = i / steps; w = 2 * math.pi * p
        sw = math.sin(w)                      # +1: left leg forward
        kneeL = 38 * max(0.0, math.sin(w + 0.35 * math.pi)) ** 1.4 + 6
        kneeR = 38 * max(0.0, math.sin(w + 1.35 * math.pi)) ** 1.4 + 6
        rots = {
            'thigh.L': (30 * sw, 0, 2), 'thigh.R': (-30 * sw, 0, 2),
            'shin.L': (-kneeL, 0, 0), 'shin.R': (-kneeR, 0, 0),
            'foot.L': (-10 * max(0, -sw), 0, 0), 'foot.R': (-10 * max(0, sw), 0, 0),
            'upper_arm.L': (-17 * sw, 0, 5), 'upper_arm.R': (17 * sw, 0, 5),
            'forearm.L': (12 + 10 * max(0, -sw), 0, 0), 'forearm.R': (12 + 10 * max(0, sw), 0, 0),
            'spine': (4, 0, 0), 'chest': (2, 0, 2.5 * sw), 'head': (2, 0, -2 * sw), 'hips': (0, 0, -3 * sw),
        }
        key(f, rots, (0, 0, 0.028 * (0.5 - 0.5 * math.cos(2 * w))))
    return act

def idle(length=48, steps=8):
    act = act_new('idle', length); set_action(act)
    for i in range(steps + 1):
        f = 1 + i * length / steps; p = i / steps; w = 2 * math.pi * p
        br = 0.5 - 0.5 * math.cos(w)          # the breath, 0..1
        rots = {
            'thigh.L': (2, 0, 5), 'thigh.R': (-3, 0, 4), 'shin.L': (-4, 0, 0), 'shin.R': (-5, 0, 0),
            'foot.L': (0, 0, 0), 'foot.R': (0, 0, 0),
            'upper_arm.L': (-4, 0, 7 + 1.5 * br), 'upper_arm.R': (-10, 0, 9 + 1.5 * br),
            'forearm.L': (10 + 2 * br, 0, 0), 'forearm.R': (70, 0, -34),      # the right hand sits on the belt
            'hand.R': (0, 30, 0),
            'spine': (2 + 1.5 * br, 0, 0), 'chest': (-1 + 2 * br, 0, 1), 'head': (2 + 1.5 * br, 0, -3), 'hips': (0, 0, 1),
        }
        key(f, rots, (0, 0, -0.004 * br))
    return act

walk_act = walk(); idle_act = idle(); set_action(idle_act)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT))
print('saved', os.path.abspath(OUT), 'parts', len(P), 'gear', len(G))
