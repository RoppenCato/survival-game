"""The rocks (2026-10-21, the kraken round: chosen tones, a few bolder facets, living moss, the line only where colours meet). The rocks of the starter island as set pieces (2026-10-20; art plan item 9, the fourth of Robin's order): the rock, the boulder
and the rock formation, six variants each (the game plants rocks in six). The art plan on the drawn rocks: the most consistent
family, faceted grey with moss; keep the look, give them the lit side. So: Bauer's erratics, a few big facets, flat shaded so the
sun lights the top and the left and the lower right falls into cool shade, moss capping some, a pale lichen patch on others, the
hero's line round the whole and ink only at the sharp joins. The crack of mining is the game's to draw over. Rendered from the
set pieces' camera as the trees and plants were: 35 degrees above the ground, looking north, 4 px a game unit when packed,
twice that here.

  rock           one stone, knee to hip high, 0.9 to 1.4 m across; variants: a slab, a wedge, a split pair, mossy, lichened, plain
  boulder        a glacial erratic chest high, 1.8 to 2.4 m across, sunk a little, a moss cap, a small stone at its side
  rockFormation  two or three tall shards leaning together, 1.6 to 2.2 m, a fallen piece at the foot, moss on the tallest

  node tools/blender.js rocks_build.py -- <out dir> [--only rock_1,boulder_4] [--variants 6]
  Writes <name>.png and meta.json (the origin's pixel, the pixels a metre), for tools/pieces_pack.js."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'                                   # the kraken round (2026-10-21)
from skin import ball
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
def opt(k, d): return argv[argv.index(k) + 1] if k in argv else d
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
ONLY = opt('--only', '').split(',') if '--only' in argv else None; NV = int(opt('--variants', '6'))
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2; rad = math.radians; TAU = 2 * math.pi
rnd = random.Random(11)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
TINTS = ['#6e7a80', '#64748a', '#7c7a70', '#6a7884', '#6e7c74', '#5e6a74']      # 2026-10-21: the six a little warmer and more saturated, each its own (chosen tones give the cool shade)
def mats(v):
    for k, c in {'rock': TINTS[v % 6], 'moss': '#5c8f3a', 'mossl': '#6fa048', 'lichen': '#b2b99c', 'grass': '#7fb04c'}.items():
        if k in ('moss', 'mossl', 'grass'):                 # living green, the leaves' lighter, smaller shade (2026-10-21)
            lit, shade = toon.chosen_tones(c, lit_dl=0.09, shade_dl=0.075, cool_k=0.2); C[k] = toon.material('r_' + k, c, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
        else: C[k] = toon.material('r_' + k, c, None, 'cel', t_dark=0.62, t_lit=0.95)   # stone: all three tones on its facets (at the kraken's 1.2 hardly a facet was lit, and the rock read flat)
def obj(name, coll, bm, m, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def stone(name, coll, m, c, size, n=14, flat=0.22, tilt=(0, 0), rz=0.0, merge=15.0, cap=0.0):   # 2026-10-21: merge 12 to 15, a few bolder facets
    """a stone: the hull of n random points on an ellipsoid, its underside cut flat so it sits; near-flat joins dissolved so
    a few big facets are left for the sun to light one by one. size: half extents (x, y, z); flat: how far up the bottom is cut;
    tilt: a lean (about x, about y) in radians"""
    pts = []
    for i in range(n):
        th, ph = U(0, TAU), math.acos(U(-1, 1)); r = U(0.72, 1.0)
        p = Vector((math.sin(ph) * math.cos(th) * r, math.sin(ph) * math.sin(th) * r, math.cos(ph) * r))
        p.z = max(p.z, -1 + flat * 2)
        if cap: p.z = min(p.z, 1 - cap * 2)
        pts.append(p)
    for k in range(6): a = TAU * k / 6 + U(-0.2, 0.2); pts.append(Vector((math.cos(a) * U(0.8, 1.0), math.sin(a) * U(0.8, 1.0), -1 + flat * 2)))   # the footing ring
    if cap:
        for k in range(5): a = TAU * k / 5 + U(-0.2, 0.2); pts.append(Vector((math.cos(a) * U(0.5, 0.8), math.sin(a) * U(0.5, 0.8), 1 - cap * 2)))   # a worn flat top
    bm = bmesh.new()
    for p in pts: bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts[:]); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.dissolve_limit(bm, angle_limit=rad(merge), verts=bm.verts[:], edges=bm.edges[:])
    R = Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(tilt[0], 4, 'X') @ Matrix.Rotation(tilt[1], 4, 'Y')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ R @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)) @ Matrix.Translation((0, 0, 1 - flat * 2)), verts=bm.verts)
    return obj(name, coll, bm, m)
def top_of(o, frac=0.75):
    """the stone's upper vertices, in world space: where moss and lichen sit"""
    vs = [o.matrix_world @ v.co for v in o.data.vertices]; zmax = max(v.z for v in vs); zmin = min(v.z for v in vs)
    return [v for v in vs if v.z > zmin + (zmax - zmin) * frac], zmax
def blob(name, coll, m, spheres, voxel=0.04):
    bm = bmesh.new()
    for (c, r, s) in spheres: bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((s[0], s[1], s[2], 1.0)))
    me = bpy.data.meshes.new(name + '_raw'); bm.to_mesh(me); bm.free(); tmp = bpy.data.objects.new(name + '_raw', me); coll.objects.link(tmp)
    rm = tmp.modifiers.new('Remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.use_smooth_shade = True
    sm = tmp.modifiers.new('Smooth', 'SMOOTH'); sm.factor = 0.5; sm.iterations = 1
    bpy.context.view_layer.update(); me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get())); bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
    me2.materials.append(m); o = bpy.data.objects.new(name, me2); coll.objects.link(o); return o
def moss_cap(name, coll, o, m='moss', k=0.9, sink=0.35):
    """moss draped over the stone's top: flattened balls at its upper vertices, sunk into the rock and melted together"""
    top, zmax = top_of(o, 0.6); sp = []
    cx = sum(v.x for v in top) / len(top); cy = sum(v.y for v in top) / len(top)
    for v in top:
        r = U(0.16, 0.26) * k; px, py = v.x * 0.8 + cx * 0.2, v.y * 0.8 + cy * 0.2 - 0.04 * k; sp.append(((px, py, v.z - r * sink), r, (1.4, 1.2, 0.42)))
        for j in range(3): a = U(0, TAU); sp.append(((px + math.cos(a) * r * 1.1, py + math.sin(a) * r * 0.9, v.z - r * sink - 0.02), r * U(0.3, 0.45), (1.2, 1.1, 0.5)))   # the scalloped rim
    sp.append(((cx, cy - 0.03 * k, zmax - 0.05 * k), 0.24 * k, (1.4, 1.2, 0.4)))
    blob(name, coll, C[m], sp)
def lichen(name, coll, o, n=3):
    """pale patches on the upper face toward the camera"""
    top, zmax = top_of(o, 0.45); top = [v for v in top if v.y < 0.05] or top
    for i in range(min(n, len(top))):
        v = top[int(U(0, len(top) - 0.01))]; r = U(0.08, 0.13)
        for j in range(3): ball('%s%d_%d' % (name, i, j), coll, C['lichen'], (v.x + U(-r, r) * 0.8, v.y - 0.02 + U(-r, r) * 0.5, v.z - 0.035), r * U(0.6, 1.0), 1.3, 1.0, 0.3)
def tuft(name, coll, c, r=0.1):
    blob(name, coll, C['grass'], [((c[0], c[1], 0.04), r, (1.2, 1.0, 0.7)), ((c[0] + r * 0.6, c[1] - r * 0.3, 0.05), r * 0.7, (1, 1, 0.8))], voxel=0.03)

# ---- the kinds -------------------------------------------------------------------------------------------------------
def rock(coll, v):
    w = U(0.9, 1.4) / 2
    if v == 0:   o = stone('rock', coll, C['rock'], (0, 0, 0), (w, w * U(0.7, 0.85), w * U(0.5, 0.65)), n=14, rz=U(0, TAU))                        # a plain rock, knee high
    elif v == 1: o = stone('rock', coll, C['rock'], (0, 0, 0), (w * 1.1, w * 0.8, w * 0.34), n=14, flat=0.3, cap=0.2, rz=U(0, TAU))                        # a flat slab
    elif v == 2: o = stone('rock', coll, C['rock'], (0, 0, 0), (w * 0.8, w * 0.7, w * U(0.9, 1.1)), n=12, tilt=(U(-0.15, 0.15), U(-0.2, 0.2)))       # a wedge, hip high
    elif v == 3: o = stone('rock', coll, C['rock'], (0, 0, 0), (w, w * 0.8, w * 0.6), n=14, rz=U(0, TAU)); moss_cap('moss', coll, o, k=0.6, sink=0.5)            # mossy
    elif v == 4: o = stone('rock', coll, C['rock'], (0, 0, 0), (w, w * 0.75, w * 0.55), n=14, rz=U(0, TAU)); lichen('lichen', coll, o, 2)             # lichened
    else:
        o = stone('rock', coll, C['rock'], (-w * 0.35, 0, 0), (w * 0.7, w * 0.65, w * 0.6), n=10, rz=U(0, TAU))                                         # a split pair
        stone('rock2', coll, C['rock'], (w * 0.5, U(-0.1, 0.1), 0), (w * 0.5, w * 0.5, w * 0.4), n=9, rz=U(0, TAU))
    top, zmax = top_of(o); return dict(h=zmax + 0.1, w=w * 2.6 + 0.4)
def boulder(coll, v):
    w = U(1.8, 2.4) / 2; h = w * U(0.6, 0.75)
    o = stone('boulder', coll, C['rock'], (0, 0, -0.06), (w, w * U(0.75, 0.9), h), n=20 + (v % 3) * 4, flat=0.18, rz=U(0, TAU), tilt=(U(-0.08, 0.08), U(-0.08, 0.08)), merge=12.0)
    if v in (0, 2, 3, 5): moss_cap('moss', coll, o, k=1.0, sink=0.55)
    if v in (1, 3, 4): lichen('lichen', coll, o, 3)
    sd = -1 if v % 2 else 1; stone('small', coll, C['rock'], (sd * w * 1.05, -w * 0.3, 0), (w * 0.28, w * 0.25, w * 0.2), n=9, rz=U(0, TAU))         # the small stone at its side
    top, zmax = top_of(o); return dict(h=zmax + 0.12, w=w * 3.0 + 0.4)
def formation(coll, v):
    H = U(1.6, 2.2); n = 3 if v % 2 == 0 else 2; tallest = None; zt = 0
    for k in range(n):
        a = TAU * k / n + U(-0.3, 0.3) + v; r = 0.28 if n == 3 else 0.22; x, y = math.cos(a) * r, math.sin(a) * r * 0.7; hk = H * (1.0 if k == 0 else U(0.6, 0.85)); hw = U(0.38, 0.52)
        lean = Vector((-x, -y, 0)); lean = lean.normalized() * U(0.08, 0.2) if lean.length > 0 else Vector((0, 0, 0))                                       # leaning in toward the middle
        o = stone('shard%d' % k, coll, C['rock'], (x, y, 0), (hw, hw * U(0.6, 0.8), hk / 2), n=14, flat=0.1, cap=U(0.08, 0.2), tilt=(lean.y, -lean.x), rz=U(0, TAU), merge=15.0)
        top, zmax = top_of(o)
        if zmax > zt: zt, tallest = zmax, o
    stone('fallen', coll, C['rock'], (U(-0.3, 0.3), -0.65, 0), (0.3, 0.22, 0.14), n=10, flat=0.3, rz=U(0, TAU))                                            # a fallen piece at the foot
    if v in (0, 3): moss_cap('moss', coll, tallest, k=0.55, sink=0.65)
    if v in (1, 2, 4, 5): lichen('lichen', coll, tallest, 2)
    return dict(h=zt + 0.12, w=2.4 + 0.4)

CREASE = {'rock': 118, 'boulder': 112, 'rockFormation': 118}                        # ink the sharp joins between facets, not every bend
KINDS = {'rock': rock, 'boulder': boulder, 'rockFormation': formation}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for ki, (kind, fn) in enumerate(KINDS.items()):
    for v in range(NV):
        name = '%s_%d' % (kind, v + 1)
        if ONLY and name not in ONLY: continue
        rnd.seed(100 * ki + v + 5); sc, coll = fresh(); C.clear(); mats(v); cfg = fn(coll, v)
        toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
        H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 0.8; aim = H * 0.38
        cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
        toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
        fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(CREASE.get(kind, 100))
        toon.piece_line(fs, at_colours=True)               # 2026-10-21: the line only where colours meet (the facets' own light parts them)
        sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
        a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
        meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
        print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
