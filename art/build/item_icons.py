"""The materials and the food as icons, rendered (2026-10-22; Robin: "A lot of the icons needs updating. Like the food icons, berries,
wood, stone etc. They look too childish and old now, they need to be in line with the art direction." Then "Yeah do the icons").
Every kind the game drew in code (templates/game.html drawDropIcon) as a small model in the kraken round's look: chosen tones, the
line only where colours meet, big simple masses, seen from a little above so a thing shows its volume, framed by its own bounds so
it fills the picture. One picture a kind, 160 px (rendered at 320), transparent, no tint.
  node tools/blender.js item_icons.py -- <out dir> [kinds]"""
import bpy, bmesh, math, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'
toon.GRAIN_K = 0.025                                    # less grain than a figure's: on an icon's dark flask or charcoal it read as dirt
from mathutils import Vector, Matrix, Euler, noise

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
ONLY = argv[1].split(',') if len(argv) > 1 else None
SIZE, PX = 160, 2
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; vl = bpy.context.view_layer
coll = bpy.data.collections.new('Icon'); sc.collection.children.link(coll)
toon.world(sc, style='cel'); toon.sun('cel'); toon.setup_render(sc, SIZE, PX, 16)
cam_d = bpy.data.cameras.new('Cam'); cam_d.type = 'ORTHO'; cam = bpy.data.objects.new('Cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
fs = toon.freestyle(sc, vl, PX, coll, 'cel', weight=1.0); toon.inner_at_colours(fs)
TAU = 2 * math.pi
M = {}
def mat(hexs, kind='', **kw):
    key = hexs + kind
    if key not in M:
        if kind == 'leaf':
            lit, shade = toon.chosen_tones(hexs, lit_dl=0.09, shade_dl=0.075, cool_k=0.2); M[key] = toon.material('m' + key, hexs, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
        elif kind == 'stone': M[key] = toon.material('m' + key, hexs, None, 'cel', t_dark=0.62, t_lit=0.95)
        elif kind == 'flat': M[key] = toon.material('m' + key, hexs, None, 'cel', lit=hexs, shade=hexs, t_dark=-1, t_lit=99)   # one tone: a flame
        else: M[key] = toon.material('m' + key, hexs, None, 'cel', **kw)
    return M[key]
OBJS = []
def obj(name, bm, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if isinstance(m, list):
        for x in m: me.materials.append(x)
    else: me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); OBJS.append(o); return o
def ball(name, m, c, r, s=(1, 1, 1), seg=16, rings=10, smooth=True, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r, matrix=Matrix.Translation(Vector(c)) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*s, 1)))
    return obj(name, bm, m, smooth)
def tube(name, m, p0, p1, r0, r1, seg=14, smooth=True, caps=True):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; q = d.normalized().to_track_quat('Z', 'Y')
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=caps, segments=seg, radius1=r0, radius2=r1, depth=d.length, matrix=Matrix.Translation((p0 + p1) / 2) @ q.to_matrix().to_4x4())
    return obj(name, bm, m, smooth)
def hull(name, m, c, size, n=14, seed=1, merge=14, rot=0.0):
    rng = random.Random(seed); bm = bmesh.new()
    for i in range(n):
        th, ph = rng.uniform(0, TAU), math.acos(rng.uniform(-1, 1)); r = rng.uniform(0.75, 1.0); bm.verts.new((math.sin(ph) * math.cos(th) * r, math.sin(ph) * math.sin(th) * r, math.cos(ph) * r))
    bmesh.ops.convex_hull(bm, input=bm.verts[:]); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(merge), verts=bm.verts[:], edges=bm.edges[:])
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Diagonal((*size, 1)), verts=bm.verts)
    return obj(name, bm, m, smooth=False)
def lathe(name, m, prof, seg=28, c=(0, 0, 0), mats=None):
    """a turned thing from a profile [(r, z), ...] bottom to top (r 0 closes an end); mats: a material index a band"""
    bm = bmesh.new(); rings = []
    for (r, z) in prof:
        rings.append([bm.verts.new((c[0] + math.cos(TAU * i / seg) * r, c[1] + math.sin(TAU * i / seg) * r, c[2] + z)) for i in range(seg)])
    for k, (a, b) in enumerate(zip(rings, rings[1:])):
        for i in range(seg):
            f = bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
            if mats: f.material_index = mats[k]
    if prof[0][0] > 0: bm.faces.new(rings[0][::-1])
    if prof[-1][0] > 0:
        f = bm.faces.new(rings[-1])
        if mats: f.material_index = mats[-1]
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj(name, bm, m)
def remesh(o, voxel, smooth=2):
    md = o.modifiers.new('rm', 'REMESH'); md.mode = 'VOXEL'; md.voxel_size = voxel
    if smooth: s = o.modifiers.new('sm', 'SMOOTH'); s.iterations = smooth; s.factor = 0.5
    bpy.context.view_layer.objects.active = o
    for x in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=x.name)
def blob(name, m, parts, voxel=0.012, smooth=2):
    bm = bmesh.new()
    for (c, r, s) in parts: bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=9, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((*s, 1)))
    o = obj(name, bm, m); remesh(o, voxel, smooth); return o

# ---------------- the kinds ----------------
BARK, SPLIT, END = '#6e4c34', '#c49a64', '#d8b47e'
def billet(name, c, length, r, a0, a1, rot):
    """a split piece of firewood: a slice of a log, bark on the round, pale on the split faces and the ends"""
    bm = bmesh.new(); n = 8; ends = []
    for x in (-length / 2, length / 2):
        ring = [bm.verts.new((x, 0, 0))] + [bm.verts.new((x, math.cos(a0 + (a1 - a0) * i / n) * r, math.sin(a0 + (a1 - a0) * i / n) * r)) for i in range(n + 1)]
        ends.append(ring)
    A, B = ends; N = len(A)
    for i in range(N):
        f = bm.faces.new((A[i], A[(i + 1) % N], B[(i + 1) % N], B[i])); f.material_index = 0 if 1 <= i < N - 1 else 1
    f = bm.faces.new(A[::-1]); f.material_index = 2; f = bm.faces.new(B); f.material_index = 2
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Euler(rot).to_matrix().to_4x4(), verts=bm.verts)
    return obj(name, bm, [mat(BARK), mat(SPLIT), mat(END)], smooth=False)
def k_wood():
    billet('b1', (0, -0.06, 0.07), 0.62, 0.15, math.radians(200), math.radians(340), (0, 0, 0.1))
    billet('b2', (0.02, 0.14, 0.07), 0.6, 0.15, math.radians(200), math.radians(330), (0, 0, -0.05))
    billet('b3', (0.0, 0.04, 0.2), 0.64, 0.15, math.radians(20), math.radians(160), (0.25, 0, 0.04))
def k_stone():
    hull('s1', mat('#8e908e', 'stone'), (0.02, 0.05, 0.13), (0.24, 0.2, 0.15), n=16, seed=3, rot=0.4)
    hull('s2', mat('#9a9690', 'stone'), (-0.16, -0.14, 0.07), (0.13, 0.11, 0.09), n=12, seed=8, rot=1.2)
def k_fiber():
    """a bundle of flax stalks tied in the middle and spread at both ends: plant fibre"""
    rng = random.Random(4); cols = [mat('#c2b478', 'leaf'), mat('#aa9c62', 'leaf'), mat('#b8a86c', 'leaf')]
    for i in range(16):
        y = rng.uniform(-0.06, 0.06); z = 0.08 + rng.uniform(-0.04, 0.04); sp = rng.uniform(0.7, 1.3)
        mid = Vector((0, y * 0.35, 0.08 + (z - 0.08) * 0.35))
        tube('st%da' % i, cols[i % 3], (-0.3, y * 1.9 * sp, z + (z - 0.08) * 0.8), mid, 0.012, 0.015, seg=6)
        tube('st%db' % i, cols[i % 3], mid, (0.3, y * 2.1 * sp, z + (z - 0.08) * 0.9), 0.015, 0.011, seg=6)
    for x in (-0.03, 0.03): tube('bind', mat('#6e4e34'), (x, -0.06, 0.08), (x, 0.06, 0.08), 0.032, 0.032, seg=12)
def k_berries():
    leaf = mat('#3e6a34', 'leaf'); red = mat('#a8323e')
    for i, (a, l) in enumerate([(0.5, 0.17), (2.4, 0.15), (4.3, 0.16)]):
        ball('leaf%d' % i, leaf, (math.cos(a) * 0.12, math.sin(a) * 0.1, 0.04), 0.1, s=(1.0, 0.45, 0.16), rot=(0, 0.25, a))
    pts = [(0, 0, 0.1), (0.075, 0.04, 0.09), (-0.07, 0.05, 0.085), (0.03, -0.07, 0.08), (-0.05, -0.06, 0.08), (0.02, 0.02, 0.17), (-0.03, 0.09, 0.07)]
    for i, p in enumerate(pts): ball('berry%d' % i, red, p, 0.058, seg=14, rings=9)
def haunch(raw):
    meat = mat('#b4505a') if raw else mat('#8e4e2c'); fat = mat('#e6c8ae') if raw else mat('#c8905a'); bone = mat('#e8dcc2')
    bm = bmesh.new(); n = 18; rings = []
    for k in range(12):
        t = k / 11; x = -0.2 + 0.36 * t; r = 0.03 + 0.14 * math.sin(math.pi * (0.15 + 0.85 * (1 - t) ** 0.8)) ** 0.9 * (1 if t < 0.95 else 0.6)
        rings.append([bm.verts.new((x, math.cos(TAU * i / n) * r * 0.9, 0.12 + math.sin(TAU * i / n) * r * 0.8)) for i in range(n)])
    for a, b in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj('meat', bm, meat)
    tube('fat', fat, (0.1, 0, 0.12), (0.135, 0, 0.12), 0.07, 0.065, seg=18)
    tube('bone', bone, (0.12, 0, 0.12), (0.3, 0, 0.13), 0.028, 0.026, seg=12)
    ball('knob1', bone, (0.31, 0.022, 0.13), 0.035); ball('knob2', bone, (0.31, -0.022, 0.13), 0.035)
def k_meat(): haunch(True)
def k_cookedMeat(): haunch(False)
def k_hide():
    """a pelt: the hide of a deer with its four legs and short tail, fur side up, a little draped, the edge ragged"""
    fur = mat('#86603e'); rim = mat('#c4a27a')
    pts = []
    for i in range(48):
        a = TAU * i / 48; r = 0.2 * (1 + 0.15 * math.cos(2 * a))
        for la in (0.75, 2.35, 3.95, 5.5):                              # the legs
            d = (a - la + math.pi) % TAU - math.pi; r += 0.1 * math.exp(-(d / 0.16) ** 2)
        d = (a - math.pi) % TAU - math.pi; r += 0.05 * math.exp(-(d / 0.12) ** 2)   # the neck
        r *= 1 + 0.04 * math.sin(a * 13)                                # ragged
        pts.append((math.cos(a) * r * 1.25, math.sin(a) * r * 0.9))
    bm = bmesh.new(); outer = [bm.verts.new((x, y, 0.02 + 0.03 * math.sin(x * 9) * math.cos(y * 7))) for (x, y) in pts]
    inner = [bm.verts.new((x * 0.86, y * 0.86, 0.03 + 0.03 * math.sin(x * 9) * math.cos(y * 7))) for (x, y) in pts]
    ctr = bm.verts.new((0, 0, 0.045)); n = len(pts)
    for i in range(n):
        f = bm.faces.new((outer[i], outer[(i + 1) % n], inner[(i + 1) % n], inner[i])); f.material_index = 1
        f = bm.faces.new((inner[i], inner[(i + 1) % n], ctr)); f.material_index = 0
    s_ = bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.015) if hasattr(bmesh.ops, 'solidify') else None
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); obj('pelt', bm, [fur, rim])
    for i, (x, y) in enumerate([(-0.06, 0.03), (0.08, -0.04), (0.0, 0.06)]): ball('tuft%d' % i, mat('#6e4c30'), (x, y, 0.05), 0.05, s=(1.6, 0.6, 0.18), rot=(0, 0, 0.4 * i))
def k_leather():
    tan = mat('#a8703e'); tan2 = mat('#8c5a32'); cord = mat('#4e3626')
    for k, (z, m, rot, s) in enumerate([(0.03, tan2, 0.2, 1.0), (0.075, tan, -0.12, 0.92)]):
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, 0, z)) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Diagonal((0.5 * s, 0.34 * s, 0.04, 1)))
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=6, use_grid_fill=True)
        for v in bm.verts: v.co.z += 0.02 * math.sin(v.co.x * 9 + k) + 0.015 * math.cos(v.co.y * 11)
        o = obj('sheet%d' % k, bm, m)
    tube('cord', cord, (-0.02, -0.2, 0.1), (0.03, 0.2, 0.1), 0.012, 0.012, seg=8)
def k_honey():
    clay = mat('#9a6242'); honey = mat('#d89a30'); dark = mat('#6e4630')
    lathe('pot', clay, [(0.0, 0.0), (0.1, 0.0), (0.15, 0.06), (0.16, 0.13), (0.13, 0.2), (0.11, 0.22), (0.125, 0.25), (0.11, 0.255), (0.0, 0.255)])
    lathe('honeytop', honey, [(0.105, 0.245), (0.0, 0.252)])
    blob('drip', honey, [((0.08, -0.1, 0.24), 0.03, (1, 1, 1)), ((0.09, -0.11, 0.19), 0.022, (1, 1, 1.6)), ((0.095, -0.115, 0.14), 0.024, (1, 1, 1))], voxel=0.008)
    tube('dipper', dark, (-0.02, 0.0, 0.24), (-0.14, 0.1, 0.42), 0.012, 0.012, seg=8)
def k_eggs():
    straw = mat('#b49a64', 'leaf'); egg = mat('#ece3cf'); egg2 = mat('#d8c09e')
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.17, radius2=0.19, depth=0.06, matrix=Matrix.Translation((0, 0, 0.03)))
    o = obj('nest', bm, straw); remesh(o, 0.014, 1)
    for i, (p, m, r) in enumerate([((-0.05, 0.03, 0.1), egg, (0, 0.3, 0.3)), ((0.06, 0.04, 0.1), egg2, (0, -0.3, -0.5)), ((0.0, -0.06, 0.1), egg, (0.3, 0, 1.2))]):
        ball('egg%d' % i, m, p, 0.06, s=(1.0, 1.0, 1.3), rot=r)
def k_antler():
    bone = mat('#d6c4a0'); burr = mat('#9a8464')
    def branch(name, pts, r0, r1):
        n = len(pts)
        for i in range(n - 1): tube(name + str(i), bone, pts[i], pts[i + 1], r0 + (r1 - r0) * i / (n - 1), r0 + (r1 - r0) * (i + 1) / (n - 1), seg=12)
        for i in range(1, n - 1): ball(name + 'j%d' % i, bone, pts[i], r0 + (r1 - r0) * i / (n - 1), seg=12, rings=8)
    branch('beam', [(-0.25, 0, 0.05), (-0.1, 0, 0.09), (0.05, 0, 0.11), (0.18, 0, 0.2), (0.24, 0, 0.32)], 0.04, 0.016)
    branch('t1', [(-0.12, 0, 0.09), (-0.08, 0, 0.2), (-0.1, 0, 0.29)], 0.026, 0.012)
    branch('t2', [(0.05, 0, 0.11), (0.1, 0, 0.21), (0.08, 0, 0.29)], 0.024, 0.011)
    tube('burr', burr, (-0.28, 0, 0.045), (-0.24, 0, 0.05), 0.058, 0.055, seg=14)
def k_snakeBlood():
    glass = mat('#7a1e2a'); cork = mat('#9a7048'); cord = mat('#4e3626')
    lathe('flask', glass, [(0.0, 0.0), (0.07, 0.0), (0.11, 0.05), (0.12, 0.1), (0.1, 0.16), (0.045, 0.2), (0.04, 0.26), (0.05, 0.27), (0.0, 0.27)])
    lathe('cork', cork, [(0.0, 0.26), (0.036, 0.26), (0.04, 0.32), (0.0, 0.325)])
    tube('tie', cord, (-0.05, 0, 0.22), (0.05, 0, 0.22), 0.012, 0.012, seg=8)
    ball('drop', glass, (0.13, -0.05, 0.03), 0.03, s=(1, 1, 0.5))
def k_copper():
    hull('rock', mat('#7c7a76', 'stone'), (0, 0, 0.12), (0.24, 0.2, 0.15), n=16, seed=21, rot=0.3)
    for i, (p, s, m) in enumerate([((0.05, -0.15, 0.15), (0.07, 0.04, 0.06), '#3f8a6c'), ((-0.12, -0.12, 0.1), (0.06, 0.04, 0.05), '#c0743e'), ((0.0, -0.05, 0.25), (0.06, 0.05, 0.04), '#3f8a6c'), ((0.15, -0.05, 0.08), (0.05, 0.04, 0.05), '#c0743e')]):
        hull('vein%d' % i, mat(m, 'stone'), p, s, n=10, seed=30 + i)
def k_charcoal():
    for i, (p, s) in enumerate([((0, 0, 0.09), (0.2, 0.13, 0.1)), ((-0.17, 0.08, 0.07), (0.12, 0.1, 0.08)), ((0.12, 0.12, 0.06), (0.1, 0.08, 0.07))]):
        hull('char%d' % i, mat('#3a3c44', 'stone'), p, s, n=12, seed=40 + i, merge=10)
def ingot(name, m, c, L, W, H, rot=0.0, taper=0.18):
    bm = bmesh.new(); vs = []
    for (z, k) in ((0, 1.0), (H, 1.0 - taper)):
        vs.append([bm.verts.new((sx * L / 2 * k, sy * W / 2 * k, z)) for (sx, sy) in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    a, b = vs
    for i in range(4): bm.faces.new((a[i], a[(i + 1) % 4], b[(i + 1) % 4], b[i]))
    bm.faces.new(a[::-1]); bm.faces.new(b)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Rotation(rot, 4, 'Z'), verts=bm.verts)
    return obj(name, bm, m, smooth=False)
def k_copperBar(): ingot('bar', mat('#b8683c'), (0, 0, 0), 0.5, 0.17, 0.1, rot=0.15)
def k_ironBar():
    ingot('bar1', mat('#7c848d'), (0, -0.06, 0), 0.52, 0.15, 0.09, rot=0.1); ingot('bar2', mat('#6e767f'), (0.02, 0.09, 0.0), 0.5, 0.14, 0.085, rot=-0.08)
def k_silver():
    ingot('bar', mat('#c4c9d0'), (-0.04, 0.05, 0), 0.34, 0.12, 0.07, rot=0.3)
    bm = bmesh.new(); n = 30; m2 = 8; rings = []
    for i in range(n):
        a = math.radians(-40) + math.radians(230) * i / (n - 1); ctr = Vector((0.08 + math.cos(a) * 0.12, -0.06 + math.sin(a) * 0.12, 0.05 + 0.02 * math.sin(a * 3)))
        tang = Vector((-math.sin(a), math.cos(a), 0)); nrm = Vector((0, 0, 1)); bi = tang.cross(nrm)
        rings.append([bm.verts.new(ctr + (nrm * math.cos(TAU * j / m2) + bi * math.sin(TAU * j / m2)) * (0.022 + 0.004 * math.cos(i * 1.7 + j))) for j in range(m2)])
    for a_, b_ in zip(rings, rings[1:]):
        for j in range(m2): bm.faces.new((a_[j], a_[(j + 1) % m2], b_[(j + 1) % m2], b_[j]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1]); obj('ring', bm, mat('#d0d4da'))
def k_bogIron():
    rng = random.Random(5); parts = [((rng.uniform(-0.12, 0.12), rng.uniform(-0.08, 0.08), 0.1 + rng.uniform(-0.03, 0.04)), rng.uniform(0.07, 0.11), (1, 1, 0.8)) for _ in range(7)]
    blob('lump', mat('#6e4428', 'stone'), parts, voxel=0.014, smooth=1)
    for i in range(4): blob('rust%d' % i, mat('#ae6232', 'stone'), [((rng.uniform(-0.12, 0.12), -0.09 + rng.uniform(-0.02, 0.02), 0.12 + rng.uniform(-0.03, 0.05)), 0.035, (1.4, 0.6, 1))], voxel=0.01, smooth=1)
def k_torch():
    wood = mat('#8a6442'); wrap = mat('#5a4030'); band = mat('#3e2e24'); fl = mat('#e8782c', 'flat'); fl2 = mat('#f6c64a', 'flat')
    a, b = Vector((-0.22, 0, -0.22)), Vector((0.05, 0, 0.05)); h0, h1 = Vector((0.03, 0, 0.03)), Vector((0.12, 0, 0.12))
    tube('stick', wood, a, b, 0.038, 0.042, seg=12)
    tube('wrap', wrap, h0, h1, 0.07, 0.075, seg=14)
    for t in (0.3, 0.7): p = h0.lerp(h1, t); d = (h1 - h0).normalized() * 0.008; tube('band', band, p - d, p + d, 0.078, 0.078, seg=14)
    blob('flame', fl, [((0.15, 0, 0.2), 0.1, (1, 1, 1.25)), ((0.16, 0, 0.31), 0.07, (1, 1, 1.35)), ((0.15, 0, 0.41), 0.035, (1, 1, 1.6))], voxel=0.012)
    blob('flame2', fl2, [((0.15, -0.05, 0.19), 0.06, (1, 1, 1.3)), ((0.155, -0.05, 0.27), 0.04, (1, 1, 1.4))], voxel=0.01)
def bowl(contents):
    wood = mat('#8e6442')
    lathe('bowl', wood, [(0.0, 0.0), (0.1, 0.0), (0.12, 0.02), (0.2, 0.08), (0.24, 0.15), (0.225, 0.16), (0.19, 0.11), (0.0, 0.1)])
    contents()
def k_roastBerries():
    def c():
        rng = random.Random(9); m = mat('#6c2a30')
        for i in range(10): a = rng.uniform(0, TAU); r = rng.uniform(0, 0.15); ball('rb%d' % i, m, (math.cos(a) * r, math.sin(a) * r, 0.13 + rng.uniform(0, 0.05) + (0.15 - r) * 0.4), 0.05, seg=12, rings=8)
    bowl(c)
def k_stew():
    def c():
        lathe('surface', mat('#7a2c32'), [(0.2, 0.14), (0.0, 0.145)])
        for i, a in enumerate((0.3, 1.9, 3.5, 4.7)): ball('lump%d' % i, mat('#a8323e'), (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.15), 0.03, s=(1, 1, 0.6))
        tube('spoon', mat('#a07a4e'), (0.02, 0.02, 0.15), (0.22, 0.14, 0.34), 0.016, 0.014, seg=8)
        ball('spoonbowl', mat('#a07a4e'), (0.02, 0.02, 0.15), 0.04, s=(1.2, 0.8, 0.35))
    bowl(c)
def k_fishSoup():
    def c():
        lathe('broth', mat('#c9a46a'), [(0.2, 0.14), (0.0, 0.145)])
        for i, a in enumerate((0.5, 2.2, 4.0)): hull('chunk%d' % i, mat('#e6dccb'), (math.cos(a) * 0.1, math.sin(a) * 0.1, 0.155), (0.04, 0.03, 0.025), n=10, seed=60 + i)
        ball('herb', mat('#4e7a3a', 'leaf'), (-0.02, -0.03, 0.15), 0.04, s=(1.2, 0.5, 0.2), rot=(0, 0, 0.6))
    bowl(c)
# ---- the fish: one body, each kind its own shape and marks
FISH = {   # L, height, width share, back, belly, fins, marks
    'fish': (0.5, 0.085, 0.42, '#5e7066', '#d6dace', '#7a8a7c', None),
    'herring': (0.46, 0.07, 0.38, '#4e6a82', '#dfe3e8', '#8a9aa8', None),
    'perch': (0.42, 0.11, 0.42, '#7f8a40', '#dccf92', '#cc5a2e', 'bars'),
    'cod': (0.56, 0.1, 0.5, '#8a7a50', '#e2dac2', '#7a6c48', 'spots'),
    'pike': (0.66, 0.075, 0.45, '#5a7040', '#dcd8aa', '#7a8a50', 'pale'),
    'salmon': (0.6, 0.1, 0.42, '#5a6a7c', '#e4cfc4', '#6a7888', 'dark'),
    'grilledFish': (0.5, 0.085, 0.42, '#9a6a38', '#d8b070', '#7a5432', 'grill'),
    'smokedFish': (0.52, 0.09, 0.42, '#7a5028', '#d8a85a', '#6a4426', None),
}
def fish(kind):
    L, H, Wk, back, belly, fins, marks = FISH[kind]; mb, ml, mf = mat(back), mat(belly), mat(fins); eye = mat('#22262c')
    bm = bmesh.new(); n = 20; K = 22; rings = []
    snout = 1.25 if kind == 'pike' else 1.0
    for k in range(K):
        t = k / (K - 1); x = -L / 2 + L * t
        h = H * (0.18 + 0.82 * math.sin(math.pi * min(1.0, 0.06 + t * 0.94) ** 1.25) ** 0.9) * (1 - 0.65 * max(0, (t - 0.86) / 0.14) ** (1.6 / snout))
        if kind == 'cod': h *= 1.0 + 0.25 * max(0, (t - 0.6) / 0.4)
        w = h * Wk
        rings.append([bm.verts.new((x, math.cos(TAU * i / n) * w, math.sin(TAU * i / n) * h)) for i in range(n)])
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            f = bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i])); c = f.calc_center_median()
            f.material_index = 0 if c.z > -0.15 * H else 1
            if marks == 'bars' and c.z > -0.1 * H and math.sin(c.x / L * 28) > 0.55: f.material_index = 2
            if marks == 'grill' and abs(math.sin((c.x + c.z * 0.8) / L * 26)) > 0.92: f.material_index = 2
    bm.faces.new(rings[0][::-1]); f = bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    third = mat('#4a5226') if marks == 'bars' else mat('#4e3420')
    body = obj('body', bm, [mb, ml, third])
    def fin(name, pts, m=mf):
        bm = bmesh.new(); vs = [bm.verts.new(p) for p in pts]; bm.faces.new(vs); s = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
        for v in [e for e in s['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.y += 0.012
        for v in bm.verts: v.co.y -= 0.006
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces); return obj(name, bm, m, smooth=False)
    x0 = -L / 2; ht = H * 0.18
    fin('tail', [(x0 + 0.01, 0, ht * 0.8), (x0 - 0.13 * L / 0.5, 0, H * 0.95), (x0 - 0.08 * L / 0.5, 0, 0), (x0 - 0.13 * L / 0.5, 0, -H * 0.95), (x0 + 0.01, 0, -ht * 0.8)])
    fin('dorsal', [(-0.08 * L / 0.5, 0, H * 0.9), (0.02 * L / 0.5, 0, H * 1.45), (0.1 * L / 0.5, 0, H * 0.92)])
    fin('anal', [(-0.14 * L / 0.5, 0, -H * 0.7), (-0.1 * L / 0.5, 0, -H * 1.15), (-0.03 * L / 0.5, 0, -H * 0.8)])
    fin('pect', [(0.12 * L / 0.5, -H * Wk - 0.004, -H * 0.2), (0.04 * L / 0.5, -H * Wk - 0.01, -H * 0.7), (0.1 * L / 0.5, -H * Wk - 0.004, -H * 0.5)])
    ex = L / 2 - (0.07 if kind != 'pike' else 0.1) * L / 0.5
    ball('eye', eye, (ex, -H * Wk * 0.82, H * 0.25), H * 0.17, seg=10, rings=7)
    rng = random.Random(len(kind) * 7)
    if marks in ('spots', 'pale', 'dark'):
        col = {'spots': '#5a4c30', 'pale': '#d0cc96', 'dark': '#2e3640'}[marks]
        for i in range(14):
            x = rng.uniform(-L * 0.35, L * 0.32); t = (x + L / 2) / L; h = H * (0.18 + 0.82 * math.sin(math.pi * t ** 1.25) ** 0.9); z = rng.uniform(0.05, 0.7) * h
            y = -math.sqrt(max(0.0, 1 - (z / h) ** 2)) * h * Wk
            ball('spot%d' % i, mat(col), (x, y, z), H * 0.09, s=(1.2, 0.35, 1.0), seg=8, rings=6)
    if kind == 'cod': tube('barbel', mf, (L / 2 - 0.03, -0.005, -H * 0.55), (L / 2 - 0.04, -0.005, -H * 0.85), 0.006, 0.003, seg=6)
    if kind == 'grilledFish': tube('skewer', mat('#8a6442'), (-L * 0.75, 0, 0.0), (L * 0.75, 0, 0.0), 0.012, 0.01, seg=8)
    if kind == 'smokedFish':
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=0.035, radius2=0.035, depth=0.012, matrix=Matrix.Translation((x0 - 0.02, 0, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Y')); obj('tie', bm, mat('#4e3626'))
        tube('cord', mat('#4e3626'), (x0 - 0.03, 0, 0.0), (x0 - 0.16, 0, 0.0), 0.008, 0.008, seg=6)
    for o in OBJS: o.matrix_world = Matrix.Translation((0, 0, 0.12)) @ Matrix.Rotation(math.radians(28), 4, 'Y').inverted() @ o.matrix_world   # nose up and to the right: the picture's diagonal
def make_fish(k): return lambda: fish(k)
KINDS = {'wood': k_wood, 'stone': k_stone, 'fiber': k_fiber, 'berries': k_berries, 'meat': k_meat, 'hide': k_hide, 'leather': k_leather, 'honey': k_honey,
         'eggs': k_eggs, 'antler': k_antler, 'snakeBlood': k_snakeBlood, 'copper': k_copper, 'charcoal': k_charcoal, 'copperBar': k_copperBar, 'bogIron': k_bogIron,
         'ironBar': k_ironBar, 'silver': k_silver, 'torch': k_torch, 'roastBerries': k_roastBerries, 'cookedMeat': k_cookedMeat, 'stew': k_stew,
         'fishSoup': k_fishSoup}
for k in FISH: KINDS[k] = make_fish(k)
ELEV = {k: 22 for k in FISH}; ELEV.update({'wood': 32, 'stone': 30, 'fiber': 50, 'berries': 45, 'leather': 50, 'eggs': 48, 'hide': 55, 'antler': 15,
                                          'roastBerries': 45, 'stew': 45, 'fishSoup': 45, 'torch': 12, 'snakeBlood': 20, 'honey': 25})
YAW = {k: -18 for k in KINDS}; YAW.update({k: 0 for k in FISH}); YAW.update({'antler': 0, 'torch': 0})
for kind, fn in KINDS.items():
    if ONLY and kind not in ONLY: continue
    OBJS.clear(); fn(); vl.update()
    e = math.radians(ELEV.get(kind, 30)); yw = math.radians(YAW.get(kind, -18))
    look = Vector((math.sin(yw) * math.cos(e), math.cos(yw) * math.cos(e), -math.sin(e)))   # the way the camera looks: north and down
    q = look.to_track_quat('-Z', 'Z'); cam.rotation_euler = q.to_euler()
    R = q.to_matrix(); right, up = R @ Vector((1, 0, 0)), R @ Vector((0, 1, 0))
    P = [o.matrix_world @ v.co for o in OBJS for v in o.data.vertices]
    xs = [p.dot(right) for p in P]; ys = [p.dot(up) for p in P]; zs = [p.dot(look) for p in P]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2; span = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.1
    cam_d.ortho_scale = span; cam.location = right * cx + up * cy - look * (max(abs(z) for z in zs) + 5); cam_d.clip_end = 50
    sc.render.filepath = os.path.join(OUT, kind + '.png'); bpy.ops.render.render(write_still=True)
    print('ICON', kind, 'span %.2f' % span)
    for o in OBJS: bpy.data.objects.remove(o, do_unlink=True)
print('ICONS in', OUT)
