"""The hero kit's headwear (2026-10-20; Robin: "the caps look weird, need better looking headwear"; then, of the nine concepts:
"I like all the new headwear you made"). Built into art/source/hero_kit.blend in place of the first cap, helm and hood, as nine
layers for the head slot. The cloth ones (capA, capC, hoodA, hoodB, hoodC) are near white for the game to colour; the fur cap
and the helms (capB, helmA, helmB, helmC) are drawn as rendered. Two changes from the concepts: the Gjermundbu's mail hangs
at the back and sides of the neck only (at the cheeks it read as a grey beard), and the wool cap's ear flaps are larger. The first cap
and helm were spheres pulled down over the brow: from the game's high camera they swallowed the face and read as a ball or a
pot. These sit on the skull with the brim above the brows (the face must show), each with a silhouette of its own, after
Viking-age finds; cloth and fur are matte. Three of each:

  capA  a Phrygian cap: a tall soft cone of wool whose tip flops forward, a rolled brim
  capB  a conical cap with a thick fur brim and a small silver cone at the tip (the Birka and Rus caps)
  capC  a low wool cap with a rolled brim and ear flaps tied under the chin (for the cold)
  helmA the Gjermundbu helm: a rounded, slightly pointed bowl with a ridge over the top, a spectacle guard round the eyes and
        nose, a short mail curtain at the back and sides (the one whole Viking helm found)
  helmB a conical helm in four plates joined by bronze bands, a brim band and a broad nasal (the late Viking and Norman helm)
  helmC a plain iron cap, low and banded with rivets, a short nasal: the cheap first helm
  hoodA a hood up with a short cape over the shoulders and its point at the back (the Skjoldehamn hood)
  hoodB a hood up with a long tail down the back (a liripipe)
  hoodC the hood down: its cloth round the neck and shoulders, the head bare

  node tools/blender.js art/build/kit_heads.py -- art/source/hero_kit.blend art/source/hero_kit.blend"""
import bpy, bmesh, math, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(argv[0])); OUT = os.path.abspath(argv[1])
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE'); gear = bpy.data.collections['Gear']; rnd = random.Random(3)
TOP, HEAD = 1.62, 0.40; CHIN = TOP - HEAD; SH = CHIN - 0.08; SHW = 0.22
hz = CHIN + HEAD * 0.52; R = HEAD * 0.5; C = Vector((0, 0.012, hz + 0.02)); SX, SY, SZ = 0.95, 1.04, 1.04

for o in list(gear.objects):
    if o.name.startswith(('cap_', 'helm_', 'hood_')): bpy.data.objects.remove(o)
def mat(name, hexs, matte=False):
    m = bpy.data.materials.get(name) or toon.material(name, hexs, None, 'cel'); m['hex'] = hexs
    if matte: m['matte'] = 1
    toon.build_nodes(m, 'cel'); return m
def obj(name, bm, m, bone='Head', smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); gear.objects.link(o)
    vg = o.vertex_groups.new(name='mixamorig:' + bone); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    md = o.modifiers.new('Rig', 'ARMATURE'); md.object = rig; o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted(); o.hide_render = True
    return o
def ball(name, m, c, r, sx=1.0, sy=1.0, sz=1.0, bone='Head', rot=None, seg=10, rings=7):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        p = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)); p = rot @ p if rot is not None else p; v.co = p + Vector(c)
    return obj(name, bm, m, bone)
def tube(name, m, pts, radii, seg=12, closed=False, cap_end=True, bone='Head', smooth=True, flat=1.0):
    """rings along a path (closed: a loop, as for a ring round the eye), each ring square to the path"""
    bm = bmesh.new(); pts = [Vector(p) for p in pts]; n = len(pts); rings = []
    for i, p in enumerate(pts):
        a = pts[(i - 1) % n] if (closed or i > 0) else p; b = pts[(i + 1) % n] if (closed or i < n - 1) else p
        d = (b - a).normalized() if (b - a).length > 1e-9 else Vector((0, 0, 1)); q = d.to_track_quat('Z', 'Y'); r = radii[i] if isinstance(radii, (list, tuple)) else radii
        ring = []
        for k in range(seg):
            ang = 2 * math.pi * k / seg; v = Vector((math.cos(ang) * r, math.sin(ang) * r * flat, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(n if closed else n - 1):
        A, B = rings[i], rings[(i + 1) % n]
        for k in range(seg): bm.faces.new((A[k], A[(k + 1) % seg], B[(k + 1) % seg], B[k]))
    if not closed and cap_end: bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    return obj(name, bm, m, bone, smooth)
def blob(name, m, spheres, voxel=0.008, bone='Head'):
    bm = bmesh.new()
    for (c, r, s_) in spheres: bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=7, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((s_[0], s_[1], s_[2], 1.0)))
    me = bpy.data.meshes.new(name + '_raw'); bm.to_mesh(me); bm.free(); tmp = bpy.data.objects.new(name + '_raw', me); gear.objects.link(tmp)
    rm = tmp.modifiers.new('Remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.use_smooth_shade = True
    sm = tmp.modifiers.new('Smooth', 'SMOOTH'); sm.factor = 0.6; sm.iterations = 3
    bpy.context.view_layer.update(); me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get())); bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
    bm2 = bmesh.new(); bm2.from_mesh(me2); bpy.data.meshes.remove(me2); return obj(name, bm2, m, bone)

# ---- the skull and the brim: the brim sits above the brows in front and lower behind, so the face shows from above ----
def surf(theta, h, k=1.0):
    """the point on the skull (scaled sphere about C) at azimuth theta (0 front, + to his left) and height h above C, pushed out by k"""
    rr = R * math.sqrt(max(0.0, 1 - (h / (R * SZ)) ** 2))
    return C + Vector((math.sin(theta) * rr * SX * k, -math.cos(theta) * rr * SY * k, h))
def brim(hf, hb, k=1.04, n=24):
    """the brim's ring: height hf above C at the front, hb at the back, k the push out from the skull"""
    return [surf(2 * math.pi * i / n, (hf + hb) / 2 + (hf - hb) / 2 * math.cos(2 * math.pi * i / n), k) for i in range(n)]
def dome(name, m, hf, hb, k, sz=1.0, top=0.0, seg=24, rows=10):
    """a shell over the skull from the brim up: rings from the brim to the crown, lifted at the top by 'top' (a point) and scaled sz"""
    bm = bmesh.new(); rings = []
    for j in range(rows + 1):
        t = j / rows; ring = []
        for i in range(seg):
            th = 2 * math.pi * i / seg; h0 = (hf + hb) / 2 + (hf - hb) / 2 * math.cos(th); h = h0 + (R * SZ * k - h0) * (1 - math.cos(t * math.pi / 2))
            p = surf(th, min(h, R * SZ * 0.999), k); p.z = C.z + (p.z - C.z) * (1 if j == 0 else sz) + top * t ** 3
            if j == rows: p = C + Vector((0, 0, R * SZ * k * sz + top))
            ring.append(p)
        rings.append(ring)
    V = [[bm.verts.new(p) for p in ring] for ring in rings[:-1]]; apex = bm.verts.new(rings[-1][0])
    for j in range(len(V) - 1):
        for i in range(seg): bm.faces.new((V[j][i], V[j][(i + 1) % seg], V[j + 1][(i + 1) % seg], V[j + 1][i]))
    for i in range(seg): bm.faces.new((V[-1][i], V[-1][(i + 1) % seg], apex))
    return obj(name, bm, m)

WHITE, SHADE = '#efefef', '#c4c4c4'                                            # cloth the game colours (capA, capC, the hoods)
WOOLR, WOOLB, WOOLD = mat('h_clothA', WHITE, True), mat('h_woolblue', '#4d5a70', True), mat('h_clothC', WHITE, True)
FUR, FURD = mat('h_fur', '#8a6d4e', True), mat('h_furdark', '#5e4834', True); SILVER = mat('h_silver', '#c9ccd2'); LEA = mat('h_leather', '#5a3d2a', True)
IRON, IRD, MAIL, BRZ = mat('h_iron', '#8f969f'), mat('h_irondark', '#666d75'), mat('h_mail', '#7e858d', True), mat('h_bronze', '#a88436')
HOODA = HOODB = HOODC = mat('h_hood', WHITE, True)

# capA: the Phrygian cap
dome('capA_crown', WOOLR, 0.085, -0.03, 1.07)
pts = [C + Vector((0, 0.02, R * 0.95)), C + Vector((0, 0.0, R * 1.3)), C + Vector((0, -0.05, R * 1.55)), C + Vector((0, -0.12, R * 1.62)), C + Vector((0, -0.17, R * 1.48))]
tube('capA_cone', WOOLR, pts, [0.15, 0.115, 0.08, 0.05, 0.028], 14)
tube('capA_roll', mat('h_clothAband', SHADE, True), brim(0.085, -0.03, 1.09), 0.022, 8, closed=True)
# capB: the conical cap with a fur brim and a silver tip
dome('capB_crown', WOOLB, 0.09, 0.0, 1.06, sz=1.0, top=0.12)
sph = []
for i, p in enumerate(brim(0.08, -0.01, 1.12, 30)):
    for k in range(2): sph.append(((p.x + rnd.uniform(-0.01, 0.01), p.y + rnd.uniform(-0.01, 0.01), p.z + rnd.uniform(-0.012, 0.012) + 0.012 * k), 0.032 * rnd.uniform(0.85, 1.2), (1, 1, 1.15)))
blob('capB_fur', FUR, sph)
tube('capB_tip', SILVER, [C + Vector((0, 0, R * 1.06 + 0.12)), C + Vector((0, 0, R * 1.06 + 0.19))], [0.022, 0.004], 8)
# capC: the wool cap with ear flaps
dome('capC_crown', WOOLD, 0.075, -0.02, 1.06, sz=0.95)
tube('capC_roll', mat('h_clothCband', SHADE, True), brim(0.075, -0.02, 1.09), 0.026, 8, closed=True)
for sx in (-1, 1):
    ball('capC_flap' + ('L' if sx > 0 else 'R'), WOOLD, C + Vector((sx * R * 1.0, -0.005, -0.085)), 0.085, 0.38, 0.9, 1.35)
    tube('capC_tie' + ('L' if sx > 0 else 'R'), LEA, [C + Vector((sx * R * 0.96, -0.01, -0.15)), C + Vector((sx * 0.07, -0.13, -0.24))], 0.006, 6)

# helmA: Gjermundbu
dome('helmA_bowl', IRON, 0.08, -0.04, 1.1, sz=1.06, top=0.04)
tube('helmA_rim', IRD, brim(0.08, -0.04, 1.12), 0.012, 8, closed=True)
ridge = [surf(0.0, 0.08, 1.14)] + [C + Vector((0, -math.cos(a) * R * SY * 1.13, math.sin(a) * R * SZ * 1.13 * 1.06 + 0.04 * math.sin(a) ** 3)) for a in [math.radians(x) for x in range(25, 170, 12)]] + [surf(math.pi, -0.04, 1.14)]
tube('helmA_ridge', IRD, ridge, 0.013, 8)
tube('helmA_band', IRD, [C + Vector((math.cos(a) * R * SX * 1.13, 0.012, math.sin(a) * R * SZ * 1.13 * 1.06 + 0.04 * math.sin(a) ** 3)) for a in [math.radians(x) for x in range(12, 170, 12)]], 0.011, 8)
for sx in (-1, 1):                                                           # the spectacle guard: a ring round each eye, joined over the nose
    ec = C + Vector((sx * 0.062, -R * SY * 1.02, 0.012))
    tube('helmA_eye' + ('L' if sx > 0 else 'R'), IRD, [ec + Vector((math.cos(a) * 0.043, -0.012 * abs(math.sin(a)), math.sin(a) * 0.034)) for a in [2 * math.pi * k / 14 for k in range(14)]], 0.009, 6, closed=True)
tube('helmA_nose', IRD, [C + Vector((0, -R * SY * 1.08, 0.075)), C + Vector((0, -R * SY * 1.1, 0.0)), C + Vector((0, -R * SY * 1.12, -0.06))], [0.012, 0.011, 0.009], 6)
av = brim(0.0, -0.06, 1.13, 24); hang = [p for i, p in enumerate(av) if 7 <= i <= 17]          # the back half of the ring: behind the ears and round the nape
sph = [((p.x * 1.0, p.y + 0.015, p.z - 0.06 - 0.02 * (j % 2)), 0.048, (1, 0.45, 1.7)) for j, p in enumerate(hang)]
blob('helmA_mail', MAIL, sph, 0.009)
# helmB: the conical helm in four plates
dome('helmB_bowl', IRON, 0.08, 0.0, 1.1, sz=1.0, top=0.17)
tube('helmB_rim', BRZ, brim(0.08, 0.0, 1.12), 0.014, 8, closed=True)
for i in range(4):
    th = math.pi / 4 + i * math.pi / 2; band = []
    for t in [x / 8 for x in range(9)]:
        h0 = 0.04 + 0.04 * math.cos(th); h = h0 + (R * SZ * 1.1 - h0) * (1 - math.cos(t * math.pi / 2)); p = surf(th, min(h, R * SZ * 1.09), 1.12); p.z += 0.17 * t ** 3; band.append(p)
    band[-1] = C + Vector((0, 0, R * SZ * 1.1 + 0.17)); tube('helmB_band%d' % i, BRZ, band, 0.011, 6)
bm = bmesh.new(); w0, w1, z0, z1, y = 0.05, 0.03, 0.08, -0.07, -R * SY * 1.14
vs = [bm.verts.new(C + Vector(v)) for v in ((-w0, y, z0), (w0, y, z0), (w1, y - 0.01, z1), (-w1, y - 0.01, z1), (-w0, y + 0.02, z0), (w0, y + 0.02, z0), (w1, y + 0.01, z1), (-w1, y + 0.01, z1))]
for f in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new([vs[i] for i in f])
obj('helmB_nasal', bm, IRON, smooth=False)
# helmC: the plain iron cap
dome('helmC_bowl', IRON, 0.085, -0.02, 1.08, sz=0.92)
tube('helmC_rim', IRD, brim(0.085, -0.02, 1.1), 0.016, 8, closed=True)
tube('helmC_band', IRD, [surf(0.0, 0.085, 1.11)] + [C + Vector((0, -math.cos(a) * R * SY * 1.1, math.sin(a) * R * SZ * 1.1 * 0.92)) for a in [math.radians(x) for x in range(25, 170, 15)]] + [surf(math.pi, -0.02, 1.11)], 0.012, 8)
for i, p in enumerate(brim(0.085, -0.02, 1.12, 16)): ball('helmC_rivet%d' % i, IRD, p + (p - C).normalized() * 0.004, 0.009)
tube('helmC_nasal', IRD, [surf(0.0, 0.09, 1.12), C + Vector((0, -R * SY * 1.12, 0.02)), C + Vector((0, -R * SY * 1.13, -0.035))], [0.013, 0.012, 0.01], 6)

# hoods: a shell round the head, open for the face, its edge above the brows
def hood_shell(name, m, k=1.18, point=0.0):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=R * k)
    for v in bm.verts:
        p = Vector((v.co.x * 0.98, v.co.y * 1.06, v.co.z * 1.08))
        if point and p.y > 0 and p.z > 0: p = p + Vector((0, 1, 0.6)) * point * (p.y / (R * k)) * (p.z / (R * k)) ** 2      # the point at the back of the crown
        v.co = p + C
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=C + Vector((0, -R * 0.62, 0)), plane_no=Vector((0, 1, 0.18)).normalized(), clear_inner=True)   # the face's opening
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector((0, 0, CHIN - 0.04)), plane_no=Vector((0, 0, 1)), clear_inner=True)
    return obj(name, bm, m)
def shoulders(name, m, r0, r1, z0, z1, hem=0.0):
    """a cape round the shoulders (Spine2), its hem a little ragged"""
    bm = bmesh.new(); seg = 20; rings = []
    for z, r in ((z1, r1), (z0, r0)):
        rings.append([bm.verts.new(Vector((math.sin(2 * math.pi * i / seg) * r * 1.08, 0.03 + math.cos(2 * math.pi * i / seg) * r * 0.86, z - (hem * (0.5 + 0.5 * math.sin(i * 2.3)) if z == z0 else 0)))) for i in range(seg)])
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    return obj(name, bm, m, 'Spine2')
hood_shell('hoodA_head', HOODA, 1.18, 0.09)
shoulders('hoodA_cape', HOODA, SHW * 1.32, SHW * 0.62, SH - 0.17, SH + 0.07, 0.03)
hood_shell('hoodB_head', HOODB, 1.17, 0.05)
shoulders('hoodB_collar', HOODB, SHW * 1.05, SHW * 0.6, SH - 0.05, SH + 0.07)
tube('hoodB_tail', HOODB, [C + Vector((0, R * 1.05, 0.06)), C + Vector((0, R * 1.3, -0.08)), Vector((0, 0.24, SH - 0.08)), Vector((0, 0.25, SH - 0.32))], [0.07, 0.055, 0.04, 0.025], 10)
shoulders('hoodC_cowl', HOODC, SHW * 1.22, SHW * 0.7, SH - 0.08, SH + 0.05, 0.02)
ball('hoodC_back', HOODC, (0, SHW * 0.62, SH + 0.03), SHW * 0.6, 1.15, 0.72, 0.6, bone='Spine2')

bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('KIT HEADS', sorted(set(o.name.split('_')[0] for o in gear.objects if o.name[:4] in ('capA', 'capB', 'capC', 'helm', 'hood'))))
