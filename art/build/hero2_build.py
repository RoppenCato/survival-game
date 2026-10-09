"""The second hero (2026-10-09, Robin: the first was bland; a style test): a chunky figure about 3.75 heads tall with a big
readable face, mitten hands and heavy boots, a strong silhouette (a red hood worn down round the shoulders, a thick braid
over one shoulder, two belt pouches, patterned trim at the hem, the cuffs and the neck), built in a T-POSE with clean
proportions so Mixamo can auto-rig it later (art/source/hero2_tpose.fbx is the joined body mesh). The walk and idle here are
basic: the rig is rigid parts on bones, calibrated at build time (which local axis swings a bone down, forward or outward is
measured, not assumed), and Mixamo will replace them. Materials carry their colour and pattern as custom properties so
render.py can rebuild them in any style (toon.restyle). Saves art/source/hero2.blend."""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
OUT = os.path.abspath(os.path.join(SRC, 'hero2.blend')); FBX = os.path.abspath(os.path.join(SRC, 'hero2_tpose.fbx'))
FPS = 24

# the palette is the game's own hero (Eirik in src/art.js HEROES, as the game draws him on the starter island by day; 2026-10-09):
# a grey-green wool tunic, dark trousers, dark boots, warm skin, red hair and beard, the red cloak's colour on the hood, ochre trim
COL = {
    'skin': '#e3bd98', 'face': '#e3bd98', 'hair': '#a8522a', 'beard': '#8e4424', 'ink': '#231a16',
    'tunic': '#857a62', 'pants': '#4e4a52', 'boot': '#3e2c24', 'belt': '#5a3d2a', 'buckle': '#c99a3a', 'leather': '#6a4a32',
    'hood': '#8a3a34', 'trim': '#b08a3a', 'trimX': '#b08a3a', 'trim2': '#4e4a52',
}
PATTERN = {'trim': 'knot:z', 'trimX': 'knot:x', 'trim2': 'woven:z'}          # the folk style draws these; the others show plain bands

# ---- proportions: about 3.75 heads, chunky ----
TOP, HEAD = 1.62, 0.40
CHIN = TOP - HEAD; SH = CHIN - 0.08; HIP = 0.72; KNEE = 0.42; ANKLE = 0.10
SHW, HIPW = 0.22, 0.18
ARM1, ARM2 = 0.26, 0.24
hz = CHIN + HEAD * 0.52

def mesh_object(name, bm, coll, mat, group, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); coll.objects.link(o); me.materials.append(mat)
    vg = o.vertex_groups.new(name=group); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    for p in me.polygons: p.use_smooth = smooth
    return o

def cone(name, coll, mat, group, p0, p1, r0, r1, seg=10, sx=1.0, sy=1.0, smooth=True):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); axis = (p1 - p0).normalized(); q = axis.to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg; v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return mesh_object(name, bm, coll, mat, group, smooth)

def ball(name, coll, mat, group, c, r, seg=12, rings=8, sx=1.0, sy=1.0, sz=1.0):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    return mesh_object(name, bm, coll, mat, group)

def cap(name, coll, mat, group, c, r, plane_point, plane_normal, seg=12, rings=8, sx=1.0, sy=1.0, sz=1.0):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector(plane_point), plane_no=Vector(plane_normal).normalized(), clear_inner=True)
    return mesh_object(name, bm, coll, mat, group)

def box(name, coll, mat, group, c, size):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(c)
    return mesh_object(name, bm, coll, mat, group, False)

def wedge(name, coll, mat, group, rings_pts):
    bm = bmesh.new(); rings = [[bm.verts.new(Vector(p)) for p in ring] for ring in rings_pts]; n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    return mesh_object(name, bm, coll, mat, group, False)

# ---- scene, materials ----
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
body_c = bpy.data.collections.new('Body'); gear_c = bpy.data.collections.new('Gear')
sc.collection.children.link(body_c); sc.collection.children.link(gear_c)
toon.face_images()                                      # the painted faces, packed into the file before any material refers to them
M = {}
for k, v in COL.items():
    if k == 'face': M[k] = toon.material(k, v, None, 'cel', face=True)
    else: M[k] = toon.material(k, v, PATTERN.get(k))

# ---- the rig, in a T-pose ----
arm_data = bpy.data.armatures.new('HeroRig'); rig = bpy.data.objects.new('HeroRig', arm_data); sc.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); EB = arm_data.edit_bones
def bone(name, head, tail, parent=None, connect=False):
    b = EB.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = EB[parent]; b.use_connect = connect
    return b
bone('root', (0, 0, 0), (0, 0.25, 0))
bone('hips', (0, 0, HIP), (0, 0, HIP + 0.12), 'root')
bone('spine', (0, 0, HIP + 0.12), (0, 0, HIP + 0.26), 'hips', True)
bone('chest', (0, 0, HIP + 0.26), (0, 0, SH), 'spine', True)
bone('neck', (0, 0, SH), (0, 0, CHIN), 'chest', True)
bone('head', (0, 0, CHIN), (0, 0, TOP), 'neck', True)
for s, sx in (('L', 1), ('R', -1)):
    bone('upper_arm.' + s, (sx * SHW, 0, SH - 0.04), (sx * (SHW + ARM1), 0, SH - 0.04), 'chest')
    bone('forearm.' + s, (sx * (SHW + ARM1), 0, SH - 0.04), (sx * (SHW + ARM1 + ARM2), 0, SH - 0.04), 'upper_arm.' + s, True)
    bone('hand.' + s, (sx * (SHW + ARM1 + ARM2), 0, SH - 0.04), (sx * (SHW + ARM1 + ARM2 + 0.1), 0, SH - 0.04), 'forearm.' + s, True)
    bone('thigh.' + s, (sx * HIPW * 0.55, 0, HIP), (sx * HIPW * 0.55, 0, KNEE), 'hips')
    bone('shin.' + s, (sx * HIPW * 0.55, 0, KNEE), (sx * HIPW * 0.55, 0, ANKLE), 'thigh.' + s, True)
    bone('foot.' + s, (sx * HIPW * 0.55, 0, ANKLE), (sx * HIPW * 0.55, -0.18, 0.0), 'shin.' + s, True)
bpy.ops.object.mode_set(mode='OBJECT')
for pb in rig.pose.bones: pb.rotation_mode = 'XYZ'

# ---- the body ----
P = []
def part(o): P.append(o); return o
x = HIPW * 0.55
# the tunic: a broad chest, a belted waist, a skirt to mid-thigh with a patterned hem band
part(cone('chest', body_c, M['tunic'], 'chest', (0, 0, HIP + 0.1), (0, 0, SH + 0.02), HIPW * 1.25, SHW * 1.0, 10, 1.0, 0.66))
part(cone('skirt', body_c, M['tunic'], 'hips', (0, 0, HIP - 0.17), (0, 0, HIP + 0.1), HIPW * 1.5, HIPW * 1.25, 10, 1.0, 0.72))
part(cone('hem', body_c, M['trim'], 'hips', (0, 0, HIP - 0.22), (0, 0, HIP - 0.12), HIPW * 1.53, HIPW * 1.5, 12, 1.0, 0.72))
part(cone('belt', body_c, M['belt'], 'hips', (0, 0, HIP + 0.08), (0, 0, HIP + 0.14), HIPW * 1.34, HIPW * 1.32, 10, 1.0, 0.74))
part(box('buckle', body_c, M['buckle'], 'hips', (0, -HIPW * 0.98, HIP + 0.11), (0.06, 0.02, 0.05)))
part(ball('pouchL', body_c, M['leather'], 'hips', (HIPW * 0.95, -HIPW * 0.55, HIP + 0.03), 0.055, 8, 6, 1.0, 0.8, 1.15))
part(ball('pouchR', body_c, M['leather'], 'hips', (-HIPW * 1.0, -HIPW * 0.35, HIP + 0.02), 0.045, 8, 6, 1.0, 0.8, 1.15))
part(cone('neckband', body_c, M['trim2'], 'chest', (0, 0, SH - 0.03), (0, 0, SH + 0.035), SHW * 0.62, SHW * 0.58, 12, 1.0, 0.72))
part(cone('neck', body_c, M['skin'], 'neck', (0, 0, SH - 0.02), (0, 0, CHIN + 0.04), 0.06, 0.06, 8))
# the hood, worn down: a thick red cowl round the shoulders and a bulk of cloth at the nape
part(cone('cowl', body_c, M['hood'], 'chest', (0, 0.03, SH - 0.05), (0, 0.03, SH + 0.045), SHW * 0.92, SHW * 0.7, 10, 1.0, 0.8))
part(ball('hoodback', body_c, M['hood'], 'chest', (0, 0.13, SH + 0.02), 0.12, 10, 7, 1.15, 0.7, 0.55))
# the head: an egg with a cap of hair, a braid over the left shoulder, big eyes, brows, a nose, a mouth, a short beard
head = part(ball('head', body_c, M['face'], 'head', (0, 0, hz), HEAD * 0.5, 16, 12, 0.90, 0.95, 1.02))
def face_uvs(o):
    """Two UV maps on the head for the painted face, so the decal survives joining and skinning (Mixamo returns one mesh): 'face'
    is the head's own box seen from the front (u across, v up), 'facefront' puts the depth in u (0 front .. 1 back) for the mask."""
    me = o.data; xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    x0, x1, y0, y1, z0, z1 = min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)
    uf = me.uv_layers.new(name='face'); ub = me.uv_layers.new(name='facefront')
    for lp in me.loops:
        v = me.vertices[lp.vertex_index].co
        uf.data[lp.index].uv = ((v.x - x0) / (x1 - x0), (v.z - z0) / (z1 - z0)); ub.data[lp.index].uv = ((v.y - y0) / (y1 - y0), 0.0)
face_uvs(head)
part(cap('hair', body_c, M['hair'], 'head', (0, 0.01, hz + 0.02), HEAD * 0.5, (0, -0.17, hz + 0.125), (0, 0.6, 1), 12, 9, 0.95, 1.04, 1.04))
bx, bz = 0.15, hz - 0.02
for i in range(5):
    part(ball('braid%d' % i, body_c, M['hair'], 'head', (bx + 0.012 * i, 0.06 - 0.03 * i, bz - 0.085 * i), 0.052 - 0.004 * i, 8, 6, 1.0, 0.9, 1.0))
part(ball('braidtie', body_c, M['trim'], 'head', (bx + 0.06, -0.09, bz - 0.43), 0.03, 8, 6))
part(cone('nose', body_c, M['skin'], 'head', (0, -0.15, hz - 0.02), (0, -0.215, hz - 0.06), 0.03, 0.016, 8))
part(wedge('beard', body_c, M['beard'], 'head', [
    [(-0.05, -0.14, CHIN - 0.03), (0.05, -0.14, CHIN - 0.03), (0.045, -0.06, CHIN - 0.025), (-0.045, -0.06, CHIN - 0.025)],
    [(-0.14, -0.14, hz - 0.06), (0.14, -0.14, hz - 0.06), (0.15, 0.0, hz - 0.04), (-0.15, 0.0, hz - 0.04)]]))
# arms out in the T-pose: sleeves, cuff bands, mitten hands
for s, sx in (('L', 1), ('R', -1)):
    a0 = Vector((sx * SHW, 0, SH - 0.04)); a1 = Vector((sx * (SHW + ARM1), 0, SH - 0.04)); a2 = Vector((sx * (SHW + ARM1 + ARM2), 0, SH - 0.04))
    part(ball('shoulder.' + s, body_c, M['tunic'], 'upper_arm.' + s, a0 + Vector((sx * 0.02, 0, 0.02)), 0.085, 10, 7))
    part(cone('upper_arm.' + s, body_c, M['tunic'], 'upper_arm.' + s, a0 + Vector((sx * 0.03, 0, 0)), a1, 0.078, 0.066, 10))
    part(cone('forearm.' + s, body_c, M['tunic'], 'forearm.' + s, a1, a2 - Vector((sx * 0.03, 0, 0)), 0.066, 0.06, 10))
    part(cone('cuff.' + s, body_c, M['trimX'], 'forearm.' + s, a2 - Vector((sx * 0.085, 0, 0)), a2 - Vector((sx * 0.015, 0, 0)), 0.074, 0.072, 12))
    part(ball('hand.' + s, body_c, M['skin'], 'hand.' + s, a2 + Vector((sx * 0.065, 0, -0.005)), 0.085, 10, 7, 1.15, 0.85, 1.0))
# short thick legs, heavy boots
for s, sx in (('L', 1), ('R', -1)):
    part(cone('thigh.' + s, body_c, M['pants'], 'thigh.' + s, (sx * x, 0, HIP + 0.03), (sx * x, 0, KNEE), 0.1, 0.085, 10))
    part(cone('shin.' + s, body_c, M['pants'], 'shin.' + s, (sx * x, 0, KNEE + 0.01), (sx * x, 0, ANKLE + 0.14), 0.085, 0.075, 10))
    part(cone('boot.' + s, body_c, M['boot'], 'shin.' + s, (sx * x, 0, ANKLE - 0.02), (sx * x, 0, ANKLE + 0.17), 0.095, 0.088, 10))
    part(wedge('foot.' + s, body_c, M['boot'], 'foot.' + s, [
        [(sx * x - 0.075, 0.06, 0.0), (sx * x + 0.075, 0.06, 0.0), (sx * x + 0.07, -0.19, 0.0), (sx * x - 0.07, -0.19, 0.0)],
        [(sx * x - 0.08, 0.07, ANKLE + 0.02), (sx * x + 0.08, 0.07, ANKLE + 0.02), (sx * x + 0.06, -0.17, 0.05), (sx * x - 0.06, -0.17, 0.05)]]))

for o in P:
    o.parent = rig; md = o.modifiers.new('Rig', 'ARMATURE'); md.object = rig

# ---- the Mixamo mesh: every body part joined into one, in the T-pose, as FBX ----
def export_tpose():
    bm = bmesh.new()
    for o in P:
        me = o.data.copy(); me.transform(o.matrix_world); bm.from_mesh(me); bpy.data.meshes.remove(me)
    me = bpy.data.meshes.new('HeroMesh'); bm.to_mesh(me); bm.free()
    for mat in [m for m in M.values()]: me.materials.append(mat)
    j = bpy.data.objects.new('HeroMesh', me); sc.collection.objects.link(j)
    for ob in sc.objects: ob.select_set(False)
    j.select_set(True); bpy.context.view_layer.objects.active = j
    try:
        bpy.ops.export_scene.fbx(filepath=FBX, use_selection=True, apply_scale_options='FBX_SCALE_ALL', path_mode='AUTO'); print('exported', FBX)
    except Exception as e:
        print('fbx export failed:', e)
    bpy.data.objects.remove(j); bpy.data.meshes.remove(me)
export_tpose()

# ---- the rig calibrated: which local axis and sign swings each bone down, forward and outward ----
def measure(pb, base_pose):
    for b, r in base_pose.items(): rig.pose.bones[b].rotation_euler = r
    bpy.context.view_layer.update(); base = pb.tail.copy(); best = {}
    left = pb.name.endswith('.L')
    for ax in range(3):
        for sign in (1, -1):
            r = list(base_pose.get(pb.name, (0, 0, 0))); r[ax] += sign * math.radians(20); pb.rotation_euler = r; bpy.context.view_layer.update()
            d = pb.tail - base; pb.rotation_euler = tuple(base_pose.get(pb.name, (0, 0, 0)))
            for key, comp in (('down', -d.z), ('fwd', -d.y), ('out', d.x * (1 if left else -1))):
                if comp > best.get(key, (0.02,))[0]: best[key] = (comp, ax, sign)
    for b in base_pose: rig.pose.bones[b].rotation_euler = (0, 0, 0)
    pb.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()
    return {k: (v[1], v[2]) for k, v in best.items()}
AX = {}
for pb in rig.pose.bones: AX[pb.name] = measure(pb, {})
hang = {}
for s in ('L', 'R'):                                   # the forearms and hands are measured with the arm hanging, where the animations live
    ax, sg = AX['upper_arm.' + s]['down']; r = [0, 0, 0]; r[ax] = sg * math.radians(75); hang['upper_arm.' + s] = tuple(r)
for s in ('L', 'R'):
    for b in ('forearm.' + s, 'hand.' + s): AX[b] = measure(rig.pose.bones[b], hang)
print('axes', {b: AX[b] for b in ('upper_arm.L', 'forearm.L', 'thigh.L', 'shin.L', 'spine')})

def key(frame, rots, loc=None):
    """rots: bone -> dict of down / fwd / out degrees (whichever apply); the calibration turns them into local rotations."""
    for b, want in rots.items():
        r = [0.0, 0.0, 0.0]
        for k, deg in want.items():
            if k in AX[b]: ax, sg = AX[b][k]; r[ax] += sg * math.radians(deg)
        pb = rig.pose.bones[b]; pb.rotation_euler = r; pb.keyframe_insert('rotation_euler', frame=frame)
    if loc is not None:
        pb = rig.pose.bones['hips']; pb.location = (loc[0], loc[2], -loc[1]); pb.keyframe_insert('location', frame=frame)

def act_new(name, length):
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = length
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act

def walk(length=24, steps=6):
    act = act_new('walk', length)
    for i in range(steps + 1):
        f = 1 + i * length / steps; w = 2 * math.pi * i / steps; sw = math.sin(w)
        kneeL = 40 * max(0.0, math.sin(w + 0.35 * math.pi)) ** 1.4 + 5; kneeR = 40 * max(0.0, math.sin(w + 1.35 * math.pi)) ** 1.4 + 5
        key(f, {
            'thigh.L': {'fwd': 28 * sw, 'out': 2}, 'thigh.R': {'fwd': -28 * sw, 'out': 2}, 'shin.L': {'fwd': -kneeL}, 'shin.R': {'fwd': -kneeR},
            'foot.L': {'fwd': -8 * max(0, -sw)}, 'foot.R': {'fwd': -8 * max(0, sw)},
            'upper_arm.L': {'down': 72, 'fwd': -16 * sw}, 'upper_arm.R': {'down': 72, 'fwd': 16 * sw},
            'forearm.L': {'fwd': 14 + 10 * max(0, -sw)}, 'forearm.R': {'fwd': 14 + 10 * max(0, sw)},
            'spine': {'fwd': 4}, 'chest': {'fwd': 2, 'out': 2 * sw}, 'head': {'fwd': 2, 'out': -2 * sw}, 'hips': {'out': -3 * sw},
        }, (0, 0, 0.025 * (0.5 - 0.5 * math.cos(2 * w))))
    return act

def idle(length=48, steps=4):
    act = act_new('idle', length)
    for i in range(steps + 1):
        f = 1 + i * length / steps; br = 0.5 - 0.5 * math.cos(2 * math.pi * i / steps)
        key(f, {
            'thigh.L': {'fwd': 2, 'out': 4}, 'thigh.R': {'fwd': -2, 'out': 4}, 'shin.L': {'fwd': -3}, 'shin.R': {'fwd': -4},
            'upper_arm.L': {'down': 68 + 1.5 * br, 'fwd': -4}, 'upper_arm.R': {'down': 64 + 1.5 * br, 'fwd': -8},
            'forearm.L': {'fwd': 10 + 2 * br}, 'forearm.R': {'fwd': 62, 'out': -30},      # the right hand on the belt
            'spine': {'fwd': 2 + 1.5 * br}, 'chest': {'fwd': -1 + 2 * br, 'out': 1}, 'head': {'fwd': 2 + 1.5 * br, 'out': -3}, 'hips': {'out': 1},
        }, (0, 0, -0.004 * br))
    return act

walk(); idle()
os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, 'parts', len(P))
