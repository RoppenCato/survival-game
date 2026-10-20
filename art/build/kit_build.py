"""The hero as a kit (2026-10-20; Robin's decisions that day, the concepts in work/hero_kit/board_*.png): the hero's own file
made into a naked body in linen breeches with every garment a layer over it, on the people's way of drawing (one body, layers
in the order they lie, cloth in near white that the game colours, a layer loaded only when it is worn).

  node tools/blender.js art/build/kit_build.py -- <in.blend> <out.blend>
      run on hero2_mixamo.blend and on its grip files (_rest, _tilt, _chop180), which differ only in the things in the hand

Body (never coloured, always drawn): the head with the painted face, ears, nose, neck, hands, a bare chest, arms, legs and
feet, the linen breeches with their cord. Its proportions are the hero's, settled 2026-10-14.
Layers (Gear, each the meshes whose names begin with its name; render.py renders it with the body as a holdout):
  tunic      chest, skirt, sleeves, and its bands (hem, cuffs, neck) in a darker white        chest slot      coloured
  legs       trousers, and the wraps from the knee to the ankle in a darker white             legs slot       coloured
  shoes      turnshoes;  boots: boots to the calf                                             feet slot
  belt       belt, iron buckle, a pouch (drawn with the tunic or the armour)
  coat       a padded coat to mid-thigh, quilted;  mail: a mail shirt with short sleeves      armour slot     coat coloured
  cap        a leather cap;  helm: an iron helm with a nasal;  hood: a hood, up               head slot       hood coloured
  cloak      a cloak over the shoulders and down the back;  brooch: its ring pin              cloak slot      cloak coloured
  armring    a ring on the right upper arm (the metal coloured by the game)
  hairA      tied back, with the braid over the left shoulder;  hairB long and loose;  hairC cropped     the creator   coloured
  hairHatA/B/C   the same with what would stand above a cap or helm taken off (drawn instead while the head slot is filled)
  beardA     short, hanging from the chin in a V with a moustache (Robin: the first read as a scarf);  beardB long and tied
  shieldRim, shieldFace (the boards, coloured: wood for the plain shield, paint for a painted one), shieldMark (the emblem)
  the things in the hand as before (<kind>Wood, <kind>Metal)
Clips: the player's blows start at the top of the backswing (Robin, 2026-10-20: skip the anticipation) and carry the frame
they land on ('contact'); the idle is one breath, looped."""
import bpy, bmesh, math, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:]
IN, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
body = bpy.data.collections['Body']; gear = bpy.data.collections['Gear']
rnd = random.Random(7)

TOP, HEAD = 1.62, 0.40                                   # the hero's measures (hero2_build.py), T-pose, facing -Y, left at +X
CHIN = TOP - HEAD; SH = CHIN - 0.08; HIP = 0.72; KNEE = 0.42; ANKLE = 0.10
SHW, HIPW = 0.22, 0.18
hz = CHIN + HEAD * 0.52; R = HEAD * 0.5

WHITE, SHADE, SHADE2 = '#efefef', '#c4c4c4', '#a9a9a9'  # cloth for the game to colour, its darker bands, and darker still
def mat(name, hexs, matte=False):
    m = bpy.data.materials.get(name)
    if m is None: m = toon.material(name, hexs, None, 'cel')
    m['hex'] = hexs
    if matte: m['matte'] = 1
    toon.build_nodes(m, 'cel'); m.diffuse_color = (*toon.srgb(hexs), 1)
    return m
M = {k: mat(k, v) for k, v in {'k_tunic': WHITE, 'k_trim': SHADE, 'k_legs': WHITE, 'k_wrap': SHADE, 'k_wrapband': SHADE2, 'k_coat': WHITE, 'k_quilt': SHADE,
     'k_cloak': WHITE, 'k_hood': WHITE, 'k_shield': WHITE, 'k_seam': SHADE2, 'k_ring': '#cfd3d8', 'k_linen': '#d9d0bd', 'k_cord': '#8f8270', 'k_skinshade': '#b98f6c',
     'k_shoe': '#4a3426', 'k_boot': '#3e2c24', 'k_belt': '#5a3d2a', 'k_buckle': '#8d939a', 'k_pouch': '#60432d', 'k_leather': '#6a4a32', 'k_capband': '#4e3626',
     'k_iron': '#9aa1ab', 'k_irondark': '#70777f', 'k_mail': '#8d949c', 'k_bronze': '#b08a3a'}.items()}
M['k_hair'] = mat('k_hair', WHITE, matte=True); M['k_beard'] = mat('k_beard', '#e4e4e4', matte=True)
SKIN = bpy.data.materials['skin']
def setmat(o, m): o.data.materials.clear(); o.data.materials.append(m)
def drop(*names, prefix=()):
    for o in list(bpy.data.objects):
        if o.name in names or (prefix and o.name.startswith(tuple(prefix))): bpy.data.objects.remove(o)

# ---- meshes in the T-pose, each bound whole to one of Mixamo's bones (as people_build.py) ----
CUR = {'coll': body}
def obj(name, bm, m, bone, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); CUR['coll'].objects.link(o)
    vg = o.vertex_groups.new(name='mixamorig:' + bone); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    md = o.modifiers.new('Rig', 'ARMATURE'); md.object = rig
    o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
    o.hide_render = CUR['coll'] is gear
    return o
def cone(name, m, bone, p0, p1, r0, r1, seg=10, sx=1.0, sy=1.0, smooth=True):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg; v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return obj(name, bm, m, bone, smooth)
def ball(name, m, bone, c, r, seg=10, rings=7, sx=1.0, sy=1.0, sz=1.0, rot=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        p = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
        if rot is not None: p = rot @ p
        v.co = p + Vector(c)
    return obj(name, bm, m, bone, True)
def cap(name, m, bone, c, r, plane_point, plane_normal, seg=14, rings=10, sx=1.0, sy=1.0, sz=1.0, cuts=()):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    for (pp, pn) in ((plane_point, plane_normal),) + tuple(cuts):
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector(pp), plane_no=Vector(pn).normalized(), clear_inner=True)
    return obj(name, bm, m, bone, True)
def box(name, m, bone, c, size, rot=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        p = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
        if rot is not None: p = rot @ p
        v.co = p + Vector(c)
    return obj(name, bm, m, bone, False)
def blob(name, m, bone, spheres, voxel=0.009):
    """balls melted into one surface (a voxel remesh, smoothed): one outline with a ragged edge and no ink between the parts"""
    bm = bmesh.new()
    for (c, r, sc_) in spheres: bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=7, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((sc_[0], sc_[1], sc_[2], 1.0)))
    me = bpy.data.meshes.new(name + '_raw'); bm.to_mesh(me); bm.free()
    tmp = bpy.data.objects.new(name + '_raw', me); body.objects.link(tmp)
    rm = tmp.modifiers.new('Remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.use_smooth_shade = True
    sm = tmp.modifiers.new('Smooth', 'SMOOTH'); sm.factor = 0.6; sm.iterations = 4
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg)); bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
    bm2 = bmesh.new(); bm2.from_mesh(me2); bpy.data.meshes.remove(me2)
    return obj(name, bm2, m, bone, True)
def shell(o, name, m, d):
    """a garment over a part of the body: the part copied, pushed out along its normals by d, into the Gear collection"""
    c = o.copy(); c.data = o.data.copy(); c.name = name; c.data.name = name
    for k in list(c.users_collection): k.objects.unlink(c)
    gear.objects.link(c); setmat(c, m); push(c, d)
    c.hide_render = True
    return c
def push(o, d):
    """every vertex out along its normal, the normal turned outward from the part's middle where a part's faces look inward (the feet's did)"""
    vs = o.data.vertices; cen = sum((v.co for v in vs), Vector()) / len(vs)
    for v in vs:
        n = v.normal.copy()
        if n.dot(v.co - cen) < 0: n = -n
        v.co = v.co + n * d
def to_gear(o, name, m=None, d=0.0):
    for k in list(o.users_collection): k.objects.unlink(o)
    gear.objects.link(o); o.name = name
    if m is not None: setmat(o, m)
    if d: push(o, d)
    o.hide_render = True
    return o

# ---- the hero's old hair, beard and hood go ----
drop('hair', 'beard', 'cowl', 'hoodback', prefix=('fringe', 'tuft'))

# ---- the body, bare, in linen breeches; the tunic, trousers, wraps and shoes become layers over it ----
D = 0.008                                                # how far a garment stands off the body
B = {o.name: o for o in body.objects}
for n, o in B.items():
    if n == 'chest' or n.startswith(('shoulder.', 'upper_arm.', 'forearm.')): shell(o, 'tunic_' + n, M['k_tunic'], D); setmat(o, SKIN)
    elif n == 'skirt': shell(o, 'tunic_skirt', M['k_tunic'], D); bpy.data.objects.remove(o)
    elif n == 'hem' or n.startswith('cuff.') or n == 'neckband': to_gear(o, 'tunic_' + n, M['k_trim'], D)
    elif n.startswith('thigh.'): shell(o, 'legs_' + n, M['k_legs'], D); setmat(o, M['k_linen'])
    elif n.startswith(('shin.', 'boot.')): shell(o, 'legs_' + n, M['k_wrap'], D); setmat(o, SKIN)
    elif n.startswith('foot.'): shell(o, 'shoes_' + n, M['k_shoe'], 0.006); shell(o, 'boots_' + n, M['k_boot'], 0.009); setmat(o, SKIN)
    elif n in ('belt',): to_gear(o, 'belt_band', M['k_belt'], D)
    elif n == 'buckle': to_gear(o, 'belt_buckle', M['k_buckle'], D)
    elif n == 'pouchL': to_gear(o, 'belt_pouch', M['k_pouch'], D)
    elif n == 'pouchR': bpy.data.objects.remove(o)
    elif n.startswith('braid'): to_gear(o, 'hairA_' + n, M['k_hair'] if n != 'braidtie' else M['k_leather'])
for n, o in B.items():
    if n.startswith('boot.') and n in [x.name for x in bpy.data.objects]: shell(o, 'boots_shaft' + n[4:], M['k_boot'], 0.014)
CUR['coll'] = body
cone('breeches_seat', M['k_linen'], 'Hips', (0, 0.0, HIP - 0.13), (0, 0.0, HIP + 0.11), HIPW * 1.25, HIPW * 1.15, 12, 1.0, 0.7)
cone('breeches_cord', M['k_cord'], 'Hips', (0, 0.0, HIP + 0.085), (0, 0.0, HIP + 0.115), HIPW * 1.17, HIPW * 1.16, 12, 1.0, 0.71)
box('chest_line', M['k_skinshade'], 'Spine2', (0, -0.118, SH - 0.17), (0.006, 0.01, 0.13))
CUR['coll'] = gear
for sx in (-1, 1):                                       # the wraps' turns, a little uneven
    for i, z in enumerate((KNEE - 0.06, KNEE - 0.14, KNEE - 0.22, ANKLE + 0.13)):
        cone('legs_band%d%s' % (i, 'L' if sx > 0 else 'R'), M['k_wrapband'], 'LeftLeg' if sx > 0 else 'RightLeg', (sx * 0.09, 0, z - 0.008), (sx * 0.09, 0, z + 0.008 + 0.004 * (i % 2)), 0.064 - 0.004 * i, 0.064 - 0.004 * i, 10)
cone('shoes_collarL', M['k_shoe'], 'LeftFoot', (0.105, -0.01, ANKLE - 0.01), (0.105, -0.01, ANKLE + 0.03), 0.06, 0.058, 10)
cone('shoes_collarR', M['k_shoe'], 'RightFoot', (-0.105, -0.01, ANKLE - 0.01), (-0.105, -0.01, ANKLE + 0.03), 0.06, 0.058, 10)

# ---- hair: a cap under the hairline lifted off the brow, and clumps over it, each its own size and lean; matte ----
def clump(name, m, theta, phi, size, length, lean=0.0, out=0.97, flat=0.42):
    th, ph = math.radians(theta), math.radians(phi)
    n = Vector((math.sin(th) * math.sin(ph), -math.cos(th) * math.sin(ph), math.cos(ph)))
    c = Vector((0, 0.012, hz + 0.02)) + Vector((n.x * 0.95, n.y * 1.04, n.z * 1.04)) * R * out
    down = Vector((0, 0.35, -1.0)); flow = (down - down.dot(n) * n).normalized(); flow = (flow + n.cross(flow) * lean).normalized(); side = n.cross(flow).normalized()
    return ball(name, m, 'Head', c + flow * length * 0.35, size, 9, 6, 1.0, length / size, flat, rot=Matrix((side, flow, n)).transposed())
def hair(style, prefix, hat=False):
    rnd.seed({'h1': 7, 'h2': 11, 'h3': 13}[style]); m = M['k_hair']; made = []
    def keep(o):
        if hat:
            zc = sum((v.co.z for v in o.data.vertices), 0.0) / len(o.data.vertices)
            if zc > hz + 0.03: bpy.data.objects.remove(o); return
        made.append(o)
    capz = hz + (0.20 if style != 'h3' else 0.22) * R * 2
    if not hat: keep(cap(prefix + '_cap', m, 'Head', (0, 0.012, hz + 0.02), R * 0.985, (0, -0.15, capz - 0.02), (0, 0.55, 1), 14, 10, 0.95, 1.04, 1.04))
    else: keep(cap(prefix + '_cap', m, 'Head', (0, 0.012, hz + 0.02), R * 0.985, (0, -0.15, capz - 0.02), (0, 0.55, 1), 14, 10, 0.95, 1.04, 1.04, cuts=(((0, 0, hz + 0.045), (0, 0, -1)),)))
    k = 0
    if style in ('h1', 'h2'):
        for th in range(-150, 181, 28):
            if abs(th) < 55: continue
            keep(clump('%s_c%d' % (prefix, k), m, th + rnd.uniform(-7, 7), 54 + rnd.uniform(-5, 6), R * rnd.uniform(0.17, 0.22), R * rnd.uniform(0.58, 0.8), rnd.uniform(-0.3, 0.3))); k += 1
        for th in range(-140, 141, 34):
            if abs(th) < 75: continue
            keep(clump('%s_l%d' % (prefix, k), m, th + rnd.uniform(-8, 8), 82 + rnd.uniform(-5, 5), R * rnd.uniform(0.14, 0.19), R * rnd.uniform(0.45, 0.65), rnd.uniform(-0.25, 0.25))); k += 1
        for th in (-30, -4, 24):
            keep(clump('%s_t%d' % (prefix, k), m, th, 22 + rnd.uniform(-4, 4), R * rnd.uniform(0.19, 0.23), R * 0.72, 0.15, 0.985, 0.36)); k += 1
    else:
        for th in range(-160, 181, 32):
            keep(clump('%s_c%d' % (prefix, k), m, th + rnd.uniform(-8, 8), 46 + rnd.uniform(-8, 8), R * rnd.uniform(0.15, 0.19), R * rnd.uniform(0.38, 0.5), rnd.uniform(-0.3, 0.3), 0.965, 0.34)); k += 1
        for th in range(-170, 171, 30):
            if abs(th) < 80: continue
            keep(clump('%s_b%d' % (prefix, k), m, th + rnd.uniform(-8, 8), 72 + rnd.uniform(-6, 6), R * rnd.uniform(0.13, 0.17), R * rnd.uniform(0.32, 0.45), rnd.uniform(-0.3, 0.3), 0.965, 0.36)); k += 1
    if not hat:
        for i, (th, l) in enumerate(((-22, 0.5), (0, 0.58), (22, 0.46))): keep(clump('%s_f%d' % (prefix, i), m, th + 6, 34, R * 0.17, R * l, 0.55, 0.99, 0.4))
    if style == 'h1':
        for i in range(3): keep(ball('%s_tail%d' % (prefix, i), m, 'Head', (0, 0.2 + 0.01 * i, hz - 0.07 - 0.075 * i), 0.052 - 0.008 * i, 9, 6, 1.0, 0.85, 1.15))
    if style == 'h2':
        for i, x in enumerate((-0.09, 0.0, 0.09)): keep(cone('%s_fall%d' % (prefix, i), m, 'Head', (x * 0.8, 0.13, hz + 0.02), (x * 1.15, 0.17 + 0.01 * i, SH - 0.14 - 0.03 * (i == 1)), 0.075, 0.06, 9, 1.0, 0.6))
        for sx in (-1, 1):
            for i in range(3): keep(ball('%s_lock%d%s' % (prefix, i, 'L' if sx > 0 else 'R'), m, 'Head', (sx * (0.178 - 0.008 * i), 0.0 - 0.012 * i, hz - 0.08 - 0.075 * i), 0.044 - 0.006 * i, 8, 6, 0.85, 0.9, 1.2))
    return made
CUR['coll'] = gear
hair('h1', 'hairA'); hair('h2', 'hairB'); hair('h3', 'hairC')
hair('h1', 'hairHatA', hat=True); hair('h2', 'hairHatB', hat=True); hair('h3', 'hairHatC', hat=True)
for o in [o for o in gear.objects if o.name.startswith('hairA_braid')]:         # the braid belongs to the tied-back hair, under a hat too
    c = o.copy(); c.data = o.data.copy(); c.name = o.name.replace('hairA_', 'hairHatA_'); gear.objects.link(c); c.hide_render = True

# ---- beards: hanging from the chin in a V, thin along the jaw, a drooping moustache; the long one tied ----
def front(z, inset=0.0):
    dz = (z - hz) / 1.05; return -(math.sqrt(max(0.0, R * R - dz * dz)) + inset)
def beard(prefix, long=False):
    rnd.seed(5); m = M['k_beard']; sph = []
    for z, xs, s_ in ((hz - 0.105, (-0.1, -0.05, 0.0, 0.05, 0.1), 0.036), (hz - 0.15, (-0.08, -0.027, 0.027, 0.08), 0.042), (hz - 0.2, (-0.045, 0.0, 0.045), 0.042), (hz - 0.245, (-0.02, 0.022), 0.034)):
        for x in xs:
            y = min(front(z, 0.004), -0.085) - 0.01 * (z < hz - 0.18)
            sph.append(((x + rnd.uniform(-0.006, 0.006), y + rnd.uniform(-0.006, 0.0), z + rnd.uniform(-0.008, 0.008)), s_ * rnd.uniform(0.88, 1.12), (1.0, 0.8, 1.45)))
    sph.append(((0.004, -0.112, hz - 0.285), 0.024, (1.0, 0.8, 1.6)))
    for sx in (-1, 1):
        for i, (x, y, z) in enumerate(((0.135, -0.105, hz - 0.075), (0.165, -0.06, hz - 0.03), (0.18, -0.015, hz + 0.01))): sph.append(((sx * x, y, z), 0.03 - 0.004 * i, (0.75, 0.85, 1.35)))
    if long:
        for i in range(5): sph.append(((0.0, -0.12 - 0.006 * i, hz - 0.29 - 0.05 * i), 0.05 - 0.005 * i, (1.0, 0.7, 1.3)))
    blob(prefix + '_mass', m, 'Head', sph)
    for sx in (-1, 1): cone('%s_m%s' % (prefix, 'L' if sx > 0 else 'R'), m, 'Head', (sx * 0.012, front(hz - 0.055, 0.006), hz - 0.055), (sx * 0.072, front(hz - 0.1, 0.006), hz - 0.105), 0.019, 0.01, 8)
    if long: ball(prefix + '_tie', M['k_leather'], 'Head', (0, -0.14, hz - 0.43), 0.028, 8, 6)
beard('beardA'); beard('beardB', long=True)

# ---- the head slot: a leather cap, an iron helm, a hood ----
cap('cap_bowl', M['k_leather'], 'Head', c=(0, 0.01, hz + 0.02), r=0.216, plane_point=(0, 0, hz + 0.04), plane_normal=(0, 0.28, 1), sx=0.96, sy=1.04, sz=1.02)
cone('cap_band', M['k_capband'], 'Head', (0, 0.012, hz + 0.03), (0, 0.006, hz + 0.065), 0.212, 0.21, 14, 0.96, 1.04)
cap('helm_bowl', M['k_iron'], 'Head', c=(0, 0.01, hz + 0.02), r=0.224, plane_point=(0, 0, hz + 0.035), plane_normal=(0, 0.22, 1), sx=0.97, sy=1.05, sz=1.04)
cone('helm_brim', M['k_irondark'], 'Head', (0, 0.012, hz + 0.02), (0, 0.004, hz + 0.058), 0.226, 0.224, 14, 0.97, 1.05)
box('helm_nasal', M['k_irondark'], 'Head', (0, -0.214, hz - 0.035), (0.034, 0.022, 0.15)); ball('helm_knob', M['k_irondark'], 'Head', (0, 0.01, hz + 0.252), 0.03, 8, 6)
cap('hood_up', M['k_hood'], 'Head', c=(0, 0.02, hz + 0.01), r=0.24, plane_point=(0, -0.115, hz), plane_normal=(0, 1, 0.12), sx=0.98, sy=1.05, sz=1.06, cuts=(((0, 0, CHIN - 0.02), (0, 0, 1)),))
cone('hood_cowl', M['k_hood'], 'Spine2', (0, 0.03, SH - 0.06), (0, 0.03, SH + 0.06), SHW * 0.97, SHW * 0.68, 12, 1.0, 0.82)

# ---- the armour slot: a padded coat, a mail shirt (each over the tunic) ----
cone('coat_chest', M['k_coat'], 'Spine2', (0, 0, HIP + 0.1), (0, 0, SH + 0.03), HIPW * 1.25 + 0.024, SHW * 1.0 + 0.022, 12, 1.0, 0.68)
cone('coat_skirt', M['k_coat'], 'Hips', (0, 0, HIP - 0.22), (0, 0, HIP + 0.1), HIPW * 1.6, HIPW * 1.25 + 0.024, 12, 1.0, 0.76)
for i, z in enumerate((HIP + 0.02, HIP + 0.16, HIP + 0.3)):
    cone('coat_q%d' % i, M['k_quilt'], 'Spine2' if z > HIP + 0.1 else 'Hips', (0, 0, z - 0.006), (0, 0, z + 0.006), HIPW * 1.25 + 0.03 + (z - HIP) * 0.1, HIPW * 1.25 + 0.03 + (z - HIP) * 0.1, 12, 1.0, 0.69)
for s_, sx, bn in (('L', 1, 'LeftArm'), ('R', -1, 'RightArm')):
    a0 = Vector((sx * SHW, 0, SH - 0.04)); a1 = Vector((sx * (SHW + 0.26 * 0.7), 0, SH - 0.04))
    ball('coat_sh' + s_, M['k_coat'], bn, a0 + Vector((sx * 0.02, 0, 0.02)), 0.1, 10, 7); cone('coat_sl' + s_, M['k_coat'], bn, a0 + Vector((sx * 0.03, 0, 0)), a1, 0.093, 0.086, 10)
cone('mail_chest', M['k_mail'], 'Spine2', (0, 0, HIP + 0.1), (0, 0, SH + 0.025), HIPW * 1.25 + 0.016, SHW * 1.0 + 0.016, 12, 1.0, 0.68)
cone('mail_skirt', M['k_mail'], 'Hips', (0, 0, HIP - 0.1), (0, 0, HIP + 0.1), HIPW * 1.45 + 0.012, HIPW * 1.25 + 0.016, 12, 1.0, 0.74)
for s_, sx, bn in (('L', 1, 'LeftArm'), ('R', -1, 'RightArm')):
    a0 = Vector((sx * SHW, 0, SH - 0.04)); a1 = Vector((sx * (SHW + 0.26 * 0.62), 0, SH - 0.04))
    ball('mail_sh' + s_, M['k_mail'], bn, a0 + Vector((sx * 0.02, 0, 0.02)), 0.098, 10, 7); cone('mail_sl' + s_, M['k_mail'], bn, a0 + Vector((sx * 0.03, 0, 0)), a1, 0.091, 0.085, 10)

# ---- the cloak and its pin; the arm ring ----
cone('cloak_wrap', M['k_cloak'], 'Spine2', (0, 0.03, SH - 0.07), (0, 0.03, SH + 0.055), SHW * 1.04, SHW * 0.72, 12, 1.0, 0.84)
bm = bmesh.new(); rings = [[(-0.29, 0.21, 0.3), (0.29, 0.21, 0.3), (0.27, 0.28, 0.3), (-0.27, 0.28, 0.3)], [(-0.27, 0.21, HIP + 0.05), (0.27, 0.21, HIP + 0.05), (0.26, 0.28, HIP + 0.05), (-0.26, 0.28, HIP + 0.05)], [(-0.22, 0.05, SH - 0.02), (0.22, 0.05, SH - 0.02), (0.205, 0.17, SH - 0.02), (-0.205, 0.17, SH - 0.02)]]
rv = [[bm.verts.new(Vector(p)) for p in ring] for ring in rings]
for a_, b_ in zip(rv, rv[1:]):
    for i in range(4): bm.faces.new((a_[i], a_[(i + 1) % 4], b_[(i + 1) % 4], b_[i]))
bm.faces.new(rv[0][::-1]); bm.faces.new(rv[-1]); obj('cloak_back', bm, M['k_cloak'], 'Spine2', False)
ball('brooch_pin', M['k_bronze'], 'Spine2', (-0.15, -0.12, SH - 0.02), 0.03, 10, 7); cone('brooch_ring', M['k_bronze'], 'Spine2', (-0.15, -0.15, SH - 0.02), (-0.15, -0.135, SH - 0.02), 0.045, 0.045, 12)
x0 = -(SHW + 0.26 * 0.55); cone('armring_band', M['k_ring'], 'RightArm', (x0, 0, SH - 0.04), (x0 - 0.028, 0, SH - 0.04), 0.09, 0.088, 14)

# ---- the shield: the boards for the game to colour (wood for the plain one, paint for a painted one), a rawhide rim, an iron boss ----
def recolour(name, hexs):
    if bpy.data.materials.get(name): mat(name, hexs)
recolour('s_face', WHITE); recolour('s_hide', '#6b533b'); recolour('s_iron', '#9aa1aa')
face = bpy.data.objects.get('shieldFace_d')
if face:
    vs = [v.co for v in face.data.vertices]; cen = sum(vs, Vector()) / len(vs)
    capf = max(face.data.polygons, key=lambda p: p.area); nrm = capf.normal.copy()
    if (Vector(capf.center) - cen).dot(nrm) < 0: nrm = -nrm
    rad_ = max((p - cen).length for p in vs); u = nrm.cross(Vector((0, 0, 1))); u = u.normalized() if u.length > 0.1 else nrm.cross(Vector((0, 1, 0))).normalized(); w = nrm.cross(u).normalized()
    lift = max((p - cen).dot(nrm) for p in vs) + 0.002; bone = face.vertex_groups[0].name.replace('mixamorig:', '')
    for i, off in enumerate((-0.15, -0.05, 0.05, 0.15)):
        half = math.sqrt(max(0.0, (rad_ * 0.97) ** 2 - off ** 2))
        sm = box('shieldFace_seam%d' % i, M['k_seam'], bone, cen + u * off + nrm * lift, (0.006, half * 2, 0.004), rot=Matrix((u, w, nrm)).transposed())
        sm.parent = face.parent; sm.parent_type = face.parent_type; sm.parent_bone = face.parent_bone; sm.matrix_parent_inverse = face.matrix_parent_inverse.copy(); sm.matrix_basis = face.matrix_basis.copy()

# ---- the things in the hand are hidden behind the tunic and the trousers (render.py's 'under'): drawn on the far side, a blade
# behind the skirt would otherwise show over it, since the tunic is a layer now and no longer part of the body ----
for lay in sorted(set(o.name.split('_')[0] for o in gear.objects if o.name.split('_')[0].endswith(('Wood', 'Metal')))):
    objs = [o for o in gear.objects if o.name.startswith(lay + '_') and not o.get('under')]
    for i, o in enumerate(objs): o['under'] = 'tunic' if i % 2 == 0 else 'legs'

# ---- the clips: the player's blows from the top of the backswing, with the frame they land on; the idle one breath ----
CUTS = {'idle': (121, 233, None), 'attack1': (21, 62, 29), 'attack2': (31, 67, 39), 'thrust': (4, 12, 7), 'chop': (None, None, 30), 'mine': (None, None, 26)}
for name, (a, b, contact) in CUTS.items():
    act = bpy.data.actions.get(name)
    if not act: continue
    if a is not None: act.use_frame_range = True; act.frame_start = a; act.frame_end = b
    if contact is not None: act['contact'] = contact

bpy.ops.wm.save_as_mainfile(filepath=OUT)
layers = sorted(set(o.name.split('_')[0] for o in gear.objects))
print('KIT', os.path.basename(OUT), 'body', len(body.objects), 'gear layers', layers)
