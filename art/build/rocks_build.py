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

def summit(c, name, seed, at, radius, height, lean=(0.0, 0.0), snow=0.5, seg=9, rings=5):
    """one mountain top: rings of knocked-about points narrowing to a peak, in triangles; snow on what faces up above the line"""
    R = random.Random(seed); bm = bmesh.new(); V = []
    for k in range(rings):
        t = k / rings; rr = radius * (1 - t) ** 0.8; z = height * t ** 1.2; row = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5 * (k % 2)) / seg + (R.random() - 0.5) * 0.3
            r = rr * (0.78 + 0.44 * R.random()); zz = z * (0.9 + 0.2 * R.random()) if k else -0.4
            row.append(bm.verts.new((at[0] + math.cos(a) * r + lean[0] * t, at[1] + math.sin(a) * r * 0.85 + lean[1] * t, zz)))
        V.append(row)
    apex = bm.verts.new((at[0] + lean[0] + (R.random() - 0.5) * 0.4, at[1] + lean[1], height))
    for k in range(rings - 1):
        for i in range(seg):
            a, b = V[k][i], V[k][(i + 1) % seg]
            if k % 2 == 0: d, e = V[k + 1][i], V[k + 1][(i - 1) % seg]; bm.faces.new((a, b, d)); bm.faces.new((a, d, e))
            else: d, e = V[k + 1][(i + 1) % seg], V[k + 1][i]; bm.faces.new((a, b, d)); bm.faces.new((a, d, e))
    for i in range(seg): bm.faces.new((V[-1][i], V[-1][(i + 1) % seg], apex))
    bm.normal_update()
    o = obj(c, name, bm, [M['rock'], M['rock2'], M['snow'], M['snow2'], M['dark']])
    line = height * snow
    for p in o.data.polygons:
        zc = p.center.z; up = p.normal.z; r = R.random()
        if zc > line * (0.9 + 0.3 * r) and up > 0.18: p.material_index = 2 if up > 0.45 else 3
        elif zc > line * 1.5: p.material_index = 3 if up > 0 else 0
        else: p.material_index = 1 if r < 0.25 else (4 if r > 0.9 else 0)
    return o

def peak(name, seed, main, shoulders):
    c = coll(name); summit(c, name + '_main', seed, (0, 0), main[0], main[1], lean=main[2], snow=main[3])
    for i, (at, rad, h, sn) in enumerate(shoulders): summit(c, name + '_s%d' % i, seed * 7 + i, at, rad, h, lean=((at[0] > 0) * 0.6 - 0.3, 0), snow=sn, seg=8, rings=4)
    R = random.Random(seed + 3)
    for i in range(7):                                # boulders tumbled at its foot
        a = math.pi * (1.05 + 0.9 * R.random()); r = main[0] * (0.95 + 0.25 * R.random()); block(c, name + '_b%d' % i, (math.cos(a) * r, math.sin(a) * r * 0.85, 0.3), (1.2 + R.random() * 1.6, 1.0 + R.random(), 0.9 + R.random()), seed + 20 + i)
    return c

peak('peak_a', 3, (7.5, 15.0, (0.8, 0.0), 0.46), [((-6.2, 0.6), 5.2, 9.0, 0.6), ((5.6, 1.2), 4.6, 7.2, 0.72)])
peak('peak_b', 8, (6.4, 11.0, (-0.6, 0.0), 0.5), [((5.4, 0.4), 5.0, 8.4, 0.58)])
peak('peak_c', 14, (5.0, 8.2, (0.3, 0.0), 0.62), [((-4.4, 0.8), 3.8, 5.6, 0.8), ((4.2, 0.6), 3.2, 4.6, 0.9)])

def cave_mouth():
    c = coll('cave_mouth'); R = random.Random(5); W_, H_, Z0 = 1.9, 3.55, 1.1
    # the dark inside: a rough arch set back a hand from the wall line, so the rock round it stands proud
    bm = bmesh.new(); vs = [bm.verts.new((W_ * 1.02, 0.3, -0.3))]
    for i in range(19):
        a = math.pi * i / 18; k = 1 + (R.random() - 0.5) * 0.10
        vs.append(bm.verts.new((math.cos(a) * W_ * k, 0.3, Z0 + math.sin(a) ** 0.85 * (H_ - Z0) * k)))
    vs.append(bm.verts.new((-W_ * 1.02, 0.3, -0.3))); bm.faces.new(vs); obj(c, 'hole', bm, [M['hole']])
    ball(c, 'floor', (0.0, -0.35, 0.0), 1.7, 'earth', sx=1.15, sy=0.55, sz=0.04, sub=2)       # trodden earth on the threshold
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
for name, c in PIECES.items():
    for other in PIECES.values():
        for o in other.objects: o.hide_render = other is not c
    pts = [o.matrix_world @ Vector(b) for o in c.objects for b in o.bound_box]
    xs = [p.dot(right) for p in pts]; ys = [p.dot(upv) for p in pts]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2; span = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.08 + 0.6
    size = int(math.ceil(span * PPM / 2) * 2)
    cam.data.ortho_scale = size / PPM; cam.location = right * cx + upv * cy - look * 120
    toon.setup_render(sc, size, PX, 16); toon.freestyle(sc, vl, PX, c, 'cel')
    vl.update()
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    META[name] = {'size': size, 'px': PX, 'ppm': PPM, 'anchor': {'x': a.x * size * PX, 'y': (1 - a.y) * size * PX}}
    print('rendered', name, size, 'px, anchor', round(a.x * size), round((1 - a.y) * size))
with open(os.path.join(OUT, 'meta.json'), 'w') as fh: json.dump(META, fh, indent=1)
os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'rocks.blend')))
print('rocks in', OUT)
