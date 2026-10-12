"""The mountains' set pieces, modelled by script and rendered once each (2026-10-12, Robin: the mountain biome and a new cave;
set pieces from Blender, the cliff faces themselves painted in code).   node tools/blender.js art/build/rocks_build.py

  peak_a, peak_b, peak_c   snow-capped peaks that stand on the ground nobody can walk: faceted rock, a main summit and
                           shoulders, snow on what faces up above the snow line
  cave_mouth               the way into the troll's cave, to stand at the foot of a cliff face: two jambs of stacked blocks, a
                           great lintel slab, the dark inside, scree and old bones on the threshold, roots hanging from the lintel

Nothing moves and nothing turns: one render each, from the game's camera (35 degrees above the ground, looking north), in the
cel look with the ink line, at 2 pixels a unit of the game (a metre is 21.67 units). The wall of a cliff runs along X at y = 0
and faces -Y (the camera); a piece's origin is where it stands. Writes art/render/rocks/<name>.png and meta.json (the origin's
pixel and the pixels a metre); tools/props.js trims and packs them into assets/props. Saves art/source/rocks.blend."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, '..', 'source'); OUT = os.path.abspath(os.path.join(HERE, '..', 'render', 'rocks'))
UNIT = 39 / 1.8                                    # game units a metre
PPM = 2 * UNIT                                     # pixels a metre: 2 px a unit, as the props are baked
PX = 2                                             # rendered at twice that and halved by the packer
COL = {'rock': '#66737a', 'rock2': '#5a676e', 'dark': '#4a565e', 'snow': '#f4f7fb', 'snow2': '#dfe7f2', 'hole': '#0d0b10', 'hole2': '#1a161c', 'bone': '#ece4cc', 'moss': '#7d9e4c', 'grass': '#86b450', 'root': '#6b5a40', 'earth': '#8a6e50'}

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; vl = bpy.context.view_layer
M = {k: toon.material('rk_' + k, v, None, 'cel') for k, v in COL.items()}
PIECES = {}
def coll(name):
    c = bpy.data.collections.new(name); sc.collection.children.link(c); PIECES[name] = c; return c
def obj(c, name, bm, mats):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); c.objects.link(o)
    for m in mats: me.materials.append(m)
    for p in me.polygons: p.use_smooth = False
    return o

def block(c, name, centre, size, seed, mat='rock', sub=1, jit=0.16, square=0.55):
    """a chunk of rock: a ball pushed toward a box, its corners knocked about; faceted"""
    R = random.Random(seed); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    for v in bm.verts:
        p = Vector([math.copysign(abs(q) ** square, q) for q in v.co])
        p = Vector((p.x * size[0] / 2 * (1 + (R.random() - 0.5) * jit), p.y * size[1] / 2 * (1 + (R.random() - 0.5) * jit), p.z * size[2] / 2 * (1 + (R.random() - 0.5) * jit)))
        v.co = p + Vector(centre)
    o = obj(c, name, bm, [M[mat], M['rock2']])
    for p in o.data.polygons:
        if R.random() < 0.22: p.material_index = 1
    return o
def cone(c, name, p0, p1, r0, r1, mat, seg=6):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg; v = Vector((math.cos(a) * r, math.sin(a) * r, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return obj(c, name, bm, [M[mat]])
def ball(c, name, centre, r, mat, sx=1, sy=1, sz=1, sub=1):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(centre)
    return obj(c, name, bm, [M[mat]])

def summit(c, name, seed, at, radius, height, lean=(0.0, 0.0), snow=0.5, ridges=5, seg=44, rings=20):
    """one mountain top (2026-10-12, the second build: the first read as a crystal beside the drawn world). Ribs of rock run
    down from the top with gullies between them, the outline rough; the surface is smooth with the ribs' own edges kept
    sharp, so the cel light falls in big shapes that follow the ribs and the ink line runs down them. Snow lies low in the
    gullies and the ribs stand bare above it; bands of darker rock cross the faces."""
    R = random.Random(seed); bm = bmesh.new(); V = []
    ra = [(i + 0.2 + 0.6 * R.random()) * 2 * math.pi / ridges for i in range(ridges)]; rsz = [0.7 + 0.6 * R.random() for _ in ra]; half = math.pi / ridges
    def rib(a):                                       # 1 on a rib, 0 down a gully, scaled by how strong the nearest rib is
        best = 0.0
        for r0, s0 in zip(ra, rsz):
            d = abs((a - r0 + math.pi) % (2 * math.pi) - math.pi); best = max(best, s0 * max(0.0, 1 - d / (half * 1.15)) ** 1.5)
        return best
    p1, p2, p3 = R.random() * 6.28, R.random() * 6.28, R.random() * 6.28
    for k in range(rings):
        t = k / rings; rr = radius * (1 - t) ** 1.1 * (1 + 0.1 * math.sin(t * 8 + seed)); z = height * (t ** 0.92 + 0.035 * math.sin(t * 11 + seed * 2.3) * (1 - t)); row = []   # (a bench or two on the way up)
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5 * (k % 2)) / seg; rb = rib(a + 0.3 * t * math.sin(seed + t * 3))    # the ribs twist a little as they climb
            wob = 0.06 * math.sin(3 * a + p1 + 2 * t) + 0.045 * math.sin(7 * a + p2 - 5 * t) + 0.03 * math.sin(13 * a + p3 + 9 * t) + (R.random() - 0.5) * 0.035   # the outline rough in soft waves, a little grit on top
            r = rr * (0.7 + 0.5 * rb * (1 - 0.4 * t) * min(1.0, 0.4 + t * 4)) * (1 + wob * 1.25)                # (a rib does not reach out at the very foot: it stood out as a flat wing)
            zz = (z + (R.random() - 0.5) * height * 0.012 + rb * height * 0.045 * (1 - t)) if k else -0.4
            row.append(bm.verts.new((at[0] + math.cos(a) * r + lean[0] * t, at[1] + math.sin(a) * r * 0.82 + lean[1] * t, zz)))
        V.append(row)
    apex = bm.verts.new((at[0] + lean[0] + (R.random() - 0.5) * 0.3, at[1] + lean[1], height))
    for k in range(rings - 1):
        for i in range(seg):
            a, b = V[k][i], V[k][(i + 1) % seg]
            if k % 2 == 0: d, e = V[k + 1][i], V[k + 1][(i - 1) % seg]; bm.faces.new((a, b, d)); bm.faces.new((a, d, e))
            else: d, e = V[k + 1][(i + 1) % seg], V[k + 1][i]; bm.faces.new((a, b, d)); bm.faces.new((a, d, e))
    for i in range(seg): bm.faces.new((V[-1][i], V[-1][(i + 1) % seg], apex))
    bm.normal_update()
    o = obj(c, name, bm, [M['rock'], M['rock2'], M['snow'], M['snow2'], M['dark']])
    for p in o.data.polygons: p.use_smooth = True
    o.data.set_sharp_from_angle(angle=math.radians(58))
    line = height * snow
    for p in o.data.polygons:
        zc = p.center.z; up = p.normal.z; tt = max(0.0, min(1.0, zc / height)); r = R.random()
        rb = rib(math.atan2((p.center.y - at[1] - lean[1] * tt) / 0.82, p.center.x - at[0] - lean[0] * tt))
        sl = line * (0.7 + 0.62 * rb + (r - 0.5) * 0.08)                                         # the snow line: low in a gully, high on a rib
        if zc > sl and up > 0.1: p.material_index = 2 if (up > 0.42 or zc > line * 1.55) else 3
        else:
            band = math.sin(zc * 1.9 + rb * 1.6 + seed * 1.7 + math.sin(p.center.x * 0.9) * 0.6)  # bands of darker rock across the faces
            p.material_index = 1 if band > 0.62 else (4 if rb < 0.06 and zc < line * 0.8 else 0)       # and the gullies' floors dark
    return o

def peak(name, seed, main, shoulders):
    c = coll(name); summit(c, name + '_main', seed, (0, 0), main[0], main[1], lean=main[2], snow=main[3])
    for i, (at, rad, h, sn) in enumerate(shoulders): summit(c, name + '_s%d' % i, seed * 7 + i, at, rad, h, lean=((at[0] > 0) * 0.6 - 0.3, 0), snow=sn, ridges=4, seg=34, rings=14)
    R = random.Random(seed + 3)
    for i in range(7):                                # boulders tumbled at its foot
        a = math.pi * (1.05 + 0.9 * R.random()); r = main[0] * (0.95 + 0.25 * R.random()); block(c, name + '_b%d' % i, (math.cos(a) * r, math.sin(a) * r * 0.85, 0.3), (1.2 + R.random() * 1.6, 1.0 + R.random(), 0.9 + R.random()), seed + 20 + i)
    return c

peak('peak_a', 3, (7.5, 15.0, (0.8, 0.0), 0.46), [((-6.2, 0.6), 5.2, 9.0, 0.6), ((5.6, 1.2), 4.6, 7.2, 0.72)])
peak('peak_b', 8, (6.4, 11.0, (-0.6, 0.0), 0.5), [((5.4, 0.4), 5.0, 8.4, 0.58)])
peak('peak_c', 14, (5.0, 8.2, (0.3, 0.0), 0.62), [((-4.4, 0.8), 3.8, 5.6, 0.8), ((4.2, 0.6), 3.2, 4.6, 0.9)])
peak('peak_d', 21, (6.0, 12.5, (0.4, 0.0), 0.5), [((-6.6, 0.5), 5.0, 9.6, 0.56), ((6.4, 0.8), 4.6, 7.8, 0.64), ((-11.8, 1.0), 3.8, 5.4, 0.82)])   # a long ridge of four tops

EXTRA = {}                                            # what is rendered with a piece but takes no ink line and is left out of its frame's fitting: the inside of the cave
def lin(col): return tuple(((v / 255 + 0.055) / 1.055) ** 2.4 if v / 255 > 0.04045 else v / 255 / 12.92 for v in col) + (1.0,)
def ramp(stops, t):
    t = max(0.0, min(1.0, t)); n = len(stops) - 1; i = min(n - 1, int(t * n)); f = t * n - i
    return tuple(stops[i][k] + (stops[i + 1][k] - stops[i][k]) * f for k in range(3))
def inside_material():
    # a colour painted on every point of a mesh and shown as it is: no sun, no cel step (the inside of the cave is lit by what falls in at its mouth, worked out below)
    m = bpy.data.materials.new('rk_inside'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission'); at = nt.nodes.new('ShaderNodeVertexColor'); at.layer_name = 'Col'
    nt.links.new(at.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs[0], out.inputs['Surface']); return m
def painted(c, name, verts, faces, colour, mat):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update(); o = bpy.data.objects.new(name, me); c.objects.link(o); me.materials.append(mat)
    at = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
    for i, v in enumerate(me.vertices): at.data[i].color = lin(colour(tuple(v.co)))
    return o

def cave_inside(W_, H_, Z0):
    '''The inside of the cave, seen through its mouth (2026-10-12, Robin: more look of depth, with colour). The opening was one
    flat black shape. From the game's camera, 35 degrees above the ground, what shows through a mouth is mostly the FLOOR
    running back (a point further in lies higher on the screen) and the walls where the passage narrows. So there is a real
    passage behind the mouth: a floor, a left wall that sweeps across to the right as it goes in and a rib of rock on the
    right, the whole turning out of sight to the right. Depth is told by colour: warm earth and sunlit rock at the mouth,
    through violet-grey to deep blue and black at the back, the roof's dark coming down the walls, the sun falling in through
    the arch as one bright patch on the floor with the warm light it throws up the wall beside it, and stones on the floor
    that are paler than the dark behind them. The cliff itself is a holdout with the mouth cut in it, so nothing of the inside
    shows except through the mouth.'''
    ic = bpy.data.collections.new('cave_mouth_in'); sc.collection.children.link(ic); EXTRA['cave_mouth'] = ic; MI = inside_material()
    SUN = (0.45, 0.30, -0.84); DEEP = 5.2                                                    # (a higher sun than the world's: the patch it throws in stays at the threshold)
    FLO = [(112, 88, 64), (84, 68, 60), (56, 48, 56), (34, 31, 46), (18, 17, 30), (8, 8, 14)]      # the floor by how far in: earth in shade, violet-brown, blue, black
    WAL = [(70, 78, 96), (50, 56, 76), (34, 38, 56), (21, 23, 38), (12, 13, 22), (6, 6, 10)]      # the rock the same way, cooler: the shadow tone of the rock outside, then down to black
    def arch_top(x): u = max(-1.0, min(1.0, x / W_)); return Z0 + math.sin(math.acos(u)) ** 0.85 * (H_ - Z0)
    def xl(y): return -2.7 + 0.2 * y ** 1.75                                               # the left wall: it comes across as the passage turns right
    def xr(y): return (2.7 - 1.05 * math.sin(math.pi * y / 3.2) ** 1.3) if y <= 3.2 else 2.7 + 0.35 * (y - 3.2)   # the right wall: a rib of rock just inside, then away out of sight
    def sun1(pt):                                     # does the sun reach this point through the arch?
        t = (pt[1] - 0.1) / SUN[1]
        if t <= 0: return 1.0
        x0 = pt[0] - SUN[0] * t; z0 = pt[2] - SUN[2] * t
        return 1.0 if abs(x0) < W_ * 0.98 and 0 <= z0 < arch_top(x0) - 0.05 else 0.0
    def sunlit(pt):                                   # 0..1, a little soft at the shadow's edge (five tries a hand apart)
        return sum(sun1((pt[0] + dx, pt[1] + dy, pt[2])) for dx, dy in ((0, 0), (0.05, 0), (-0.05, 0), (0, 0.05), (0, -0.05))) / 5
    def floor_col(pt):
        x, y, z = pt; d = y / DEEP; edge = min(x - xl(y), xr(y) - x); k = 0.68 + 0.32 * max(0.0, min(1.0, edge / 0.7))   # darker along the foot of a wall
        sh = tuple(v * k for v in ramp(FLO, d)); lit = sunlit((x, y, 0.0)) if edge > 0 else 0.0; f = 1 - 0.5 * d
        return tuple(a + (b * f - a) * lit for a, b in zip(sh, (160, 124, 84)))                                          # the sun's patch: the threshold's own earth, lit
    def wall_col(side):
        def f(pt):
            x, y, z = pt; d = y / DEEP; k = 1.0 - 0.5 * min(1.0, z / 3.0)                                               # the roof's dark comes down the wall
            bounce = max(0.0, 1 - math.sqrt((x - 0.9) ** 2 + (y - 0.6) ** 2 + z * z) / 2.4) ** 1.5                      # warm light thrown up off the sunlit floor
            col = tuple(v * k + b * bounce for v, b in zip(ramp(WAL, d), (40, 26, 10)))
            if side > 0: lit = sunlit(pt); g = 1 - 0.3 * d - 0.12 * min(1.0, z / 3.0); col = tuple(a + (b * g - a) * lit for a, b in zip(col, (150, 142, 124)))   # the rib on the right catches the sun
            return col
        return f
    NY, NX, NZ = 110, 96, 16; ys = [0.2 + (DEEP + 0.3) * j / NY for j in range(NY + 1)]; xs = [-3.4 + 7.4 * i / NX for i in range(NX + 1)]
    painted(ic, 'in_floor', [(x, y, 0.0) for y in ys for x in xs], [(j * (NX + 1) + i, j * (NX + 1) + i + 1, (j + 1) * (NX + 1) + i + 1, (j + 1) * (NX + 1) + i) for j in range(NY) for i in range(NX)], floor_col, MI)
    for side, fx in ((-1, xl), (1, xr)):
        painted(ic, 'in_wall%d' % side, [(fx(y), y, 4.4 * k / NZ) for y in ys for k in range(NZ + 1)], [(j * (NZ + 1) + k, j * (NZ + 1) + k + 1, (j + 1) * (NZ + 1) + k + 1, (j + 1) * (NZ + 1) + k) for j in range(NY) for k in range(NZ)], wall_col(side), MI)
    painted(ic, 'in_back', [(-6, DEEP + 0.5, -0.6), (7, DEEP + 0.5, -0.6), (7, DEEP + 0.5, 8), (-6, DEEP + 0.5, 8)], [(0, 1, 2, 3)], lambda pt: (9, 8, 15), MI)
    for i, (x, y, s3) in enumerate(((-1.0, 1.5, 0.46), (0.55, 2.7, 0.5), (0.2, 3.9, 0.42), (1.1, 1.9, 0.3), (-0.35, 3.1, 0.26), (0.9, 4.4, 0.3))):   # stones on the floor, each paler than the dark behind it
        o = block(ic, 'in_stone%d' % i, (x, y, s3 * 0.36), (s3 * 1.5, s3 * 1.1, s3), 90 + i); o.data.materials.clear(); o.data.materials.append(MI)
        at = o.data.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT'); zc = s3 * 0.36
        for vi, v in enumerate(o.data.vertices):
            top = v.co.z > zc; g = ramp(WAL, v.co.y / DEEP * 0.9); grey = (g[0] + g[1] + g[2]) / 3
            col = tuple(min(255, (b * 0.55 + grey * 0.45) * (1.4 if top else 0.7)) for b in g)                           # paler than the dark behind it, and greyer: not a blue thing
            if top and sunlit(tuple(v.co)) > 0.5: col = (150, 140, 120)
            at.data[vi].color = lin(col)
    # the cliff: everything round the mouth, as a holdout a hand behind the wall line
    out = [(W_ * 1.36, -1.0), (W_ * 1.3, Z0 * 0.55)] + [(math.cos(math.pi * i / 24) * W_ * 1.1, Z0 + math.sin(math.pi * i / 24) ** 0.85 * (H_ - Z0) * 1.08) for i in range(25)] + [(-W_ * 1.3, Z0 * 0.55), (-W_ * 1.36, -1.0)]   # (wider at the foot: the jambs' rocks do not close it there)
    sv = []; sf = []
    for (x, z) in out: sv.append((x, 0.22, z)); sv.append((x * 10, 0.22, Z0 + (z - Z0) * 10))
    for i in range(len(out) - 1): sf.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    sh = painted(ic, 'in_cliff', sv, sf, lambda pt: (0, 0, 0), MI); sh.is_holdout = True
    return ic

def cave_mouth():
    c = coll('cave_mouth'); R = random.Random(5); W_, H_, Z0 = 1.9, 3.55, 1.1
    for i in range(19): R.random()                    # (the flat black shape that stood here drew these: the rocks keep the places they had)
    cave_inside(W_, H_, Z0)
    ball(EXTRA['cave_mouth'], 'floor', (0.0, -0.35, 0.0), 1.7, 'earth', sx=1.15, sy=0.55, sz=0.04, sub=2)       # trodden earth on the threshold (with the inside: it takes no ink line of its own, its far edge drew a bar across the mouth)
    # the rock round it: blocks set along the arch, bigger at the foot, a great one over the top; a second, rougher course outside
    ring = [(-8, 1.9, 2.0), (22, 1.5, 1.5), (48, 1.5, 1.3), (72, 1.7, 1.2), (96, 2.3, 1.35), (120, 1.6, 1.2), (142, 1.5, 1.35), (164, 1.6, 1.6), (188, 1.9, 2.0)]
    for i, (deg, sx, sz) in enumerate(ring):
        a = math.radians(deg); rx = W_ + 0.72 + (R.random() - 0.5) * 0.2; rz = H_ - Z0 + 0.62
        block(c, 'arch%d' % i, (math.cos(a) * rx, -0.35 - 0.12 * math.sin(a), max(0.75, Z0 + math.sin(a) * rz)), (sx, 1.6, sz), 10 + i, mat='rock' if i % 2 else 'rock2', jit=0.22)
    outer = [(-4, 1.6, 2.3), (30, 1.5, 1.6), (62, 1.7, 1.3), (118, 1.8, 1.3), (150, 1.5, 1.6), (184, 1.6, 2.3)]
    for i, (deg, sx, sz) in enumerate(outer):
        a = math.radians(deg); rx = W_ + 2.0; rz = H_ - Z0 + 1.45
        block(c, 'outer%d' % i, (math.cos(a) * rx, 0.0, max(1.0, Z0 + math.sin(a) * rz)), (sx, 1.1, sz), 40 + i, mat='rock2' if i % 2 else 'rock', jit=0.24)
    for i in range(10):                               # grass along the top, moss in the joints, roots hanging into the mouth
        x = -3.0 + i * 0.68 + (R.random() - 0.5) * 0.3; zt = 5.05 - 0.55 * (abs(x) / 3.2) ** 2
        cone(c, 'tuft%d' % i, (x, -0.4 + (R.random() - 0.5) * 0.4, zt), (x + (R.random() - 0.5) * 0.3, -0.5, zt + 0.4 + R.random() * 0.3), 0.11, 0.01, 'grass', seg=4)
    for (x, z, r) in ((-2.3, 3.9, 0.45), (0.5, 4.75, 0.6), (2.5, 3.7, 0.4), (-3.4, 2.2, 0.35)): ball(c, 'moss', (x, -0.95, z), r, 'moss', sx=1.3, sy=0.5, sz=0.4)
    for i in range(6):
        x = -1.3 + i * 0.52 + (R.random() - 0.5) * 0.3; zt = Z0 + (H_ - Z0) * math.sin(math.acos(max(-1, min(1, x / W_)))) ** 0.85 - 0.05; L = 0.4 + R.random() * 0.8
        cone(c, 'root%d' % i, (x, -0.3, zt), (x + (R.random() - 0.5) * 0.25, -0.35, zt - L), 0.035, 0.008, 'root', seg=4)
    for i in range(12):                               # scree on the threshold and out in front
        a = R.random() * math.pi; r = 1.4 + R.random() * 2.4; sz = 0.22 + R.random() * 0.4
        block(c, 'scree%d' % i, (math.cos(a) * r * 1.3, -1.0 - math.sin(a) * r * 0.5, sz * 0.3), (sz * 1.5, sz * 1.2, sz), 70 + i, mat='rock2' if i % 3 else 'rock')
    # what he left: a skull and a few ribs
    ball(c, 'skull', (1.25, -1.6, 0.2), 0.2, 'bone', sy=1.15, sz=0.95); ball(c, 'jaw', (1.25, -1.82, 0.1), 0.12, 'bone', sy=1.0, sz=0.6)
    for sg in (-1, 1): ball(c, 'socket%d' % sg, (1.25 + sg * 0.075, -1.78, 0.24), 0.05, 'hole')
    for i in range(4): cone(c, 'rib%d' % i, (-1.3 + i * 0.16, -1.8, 0.03), (-1.2 + i * 0.16, -1.55, 0.34 - i * 0.03), 0.028, 0.012, 'bone', seg=4)
    cone(c, 'bone0', (-0.4, -2.1, 0.05), (0.3, -1.95, 0.06), 0.045, 0.04, 'bone', seg=5); ball(c, 'bone0a', (-0.42, -2.1, 0.05), 0.07, 'bone'); ball(c, 'bone0b', (0.32, -1.95, 0.06), 0.07, 'bone')
    return c
cave_mouth()

# ---------------- render: one piece at a time, the frame fitted to it ----------------
toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.energy = 3.0; sun.data.use_shadow = False; toon.set_scene('day')   # the sun strong enough to light a face: at the characters' 1.15 nothing passes the cel step and every face takes the shadow tone (found 2026-10-12); no cast shadows
cam = toon.camera(sc, 35, 10, 0); cam.data.clip_end = 400
look = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1)); right = cam.rotation_euler.to_matrix() @ Vector((1, 0, 0)); upv = cam.rotation_euler.to_matrix() @ Vector((0, 1, 0))
os.makedirs(OUT, exist_ok=True); META = {}
ONLY = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []           # name the pieces to render only those (the others' numbers are kept)
if ONLY and os.path.exists(os.path.join(OUT, 'meta.json')): META = json.load(open(os.path.join(OUT, 'meta.json')))
for name, c in PIECES.items():
    if ONLY and name not in ONLY: continue
    for other in PIECES.values():
        for o in other.objects: o.hide_render = other is not c
    for nm, ec in EXTRA.items():
        for o in ec.objects: o.hide_render = nm != name
    pts = [o.matrix_world @ Vector(b) for o in c.objects for b in o.bound_box]
    xs = [p.dot(right) for p in pts]; ys = [p.dot(upv) for p in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2; span = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.08 + 0.6
    size = int(math.ceil(span * PPM / 2) * 2)
    cam.data.ortho_scale = size / PPM; cam.location = right * cx + upv * cy - look * 120
    toon.setup_render(sc, size, PX, 16); toon.freestyle(sc, vl, PX, c, 'cel')
    if name.startswith('peak'): vl.freestyle_settings.crease_angle = math.radians(136)   # the ribs' edges take a line too
    vl.update()
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    META[name] = {'size': size, 'px': PX, 'ppm': PPM, 'anchor': {'x': a.x * size * PX, 'y': (1 - a.y) * size * PX}}
    print('rendered', name, size, 'px, anchor', round(a.x * size), round((1 - a.y) * size))
with open(os.path.join(OUT, 'meta.json'), 'w') as fh: json.dump(META, fh, indent=1)
os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'rocks.blend')))
print('rocks in', OUT)
