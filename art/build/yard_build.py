"""The yard's things as set pieces (2026-10-20; villages plan step 4, the first batch): what a village has about it and was still
the old drawn prop. In the trees' and the camp things' hand, from the set pieces' camera: 35 degrees above the ground, looking
north, 4 px a game unit when packed, twice that here. Wood the key; iron, water and wool the cool notes; no stripes.

  storageHut     the stabbur: a small log store on four posts a man's waist off the ground, a thatch roof, a ladder up to its door      2.2 m wide, 2.8 m tall
  boathouse      the naust: a steep thatch roof over a slip, open to the south, low plank walls, a boat drawn up inside               3.6 m wide, 4.4 m deep, 2.8 m tall
  beachedBoat    a færing drawn up on the sand, listing a little, two thwarts, an oar across                                          4.0 m long
  beeSkeps       three straw skeps on a plank bench under a little board roof                                                        1.3 m wide
  washingLine    a line between two posts with wool and linen hung to dry                                                             2.2 m wide, 1.6 m tall
  quern          a hand mill: two stones and a handle on a low block                                                                  0.5 m
  spearRack      four spears leaning in a rack by the hall door                                                                       1.2 m wide, 2.1 m tall
  torchBracket   an iron bracket on a wall holding a torch (the game lights it at night)                                              at 1.6 m
  midden         the heap behind the longhouse: dark earth, bones, shells, a broken pot                                               2.0 m across
  stall          a market stall: a board on trestles under a plain wool awning, goods on it                                           1.6 m wide
  banner         a pole with a pennant in madder wool, the chieftain's gate                                                           3.0 m tall
  signPost       a post with two boards pointing the ways                                                                             1.8 m tall
  fireRing       a cold fire ring: stones round ash and a half-burnt log                                                              0.9 m across

  node tools/blender.js yard_build.py -- <out dir> [--only stall,quern]
  Writes <name>.png and meta.json (the origin's pixel, the pixels a metre), for tools/pieces_pack.js."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'                                   # the kraken round (2026-10-21): chosen tones
def kmat(name, k, v):
    """greens with the leaves' lighter, smaller shade; stone, ash and char with all three tones on their facets; the rest chosen"""
    if any(w in k for w in ('moss', 'turf', 'grass', 'leaf', 'hedge', 'ivy', 'thatchg')):
        lit, shade = toon.chosen_tones(v, lit_dl=0.09, shade_dl=0.075, cool_k=0.2); return toon.material(name, v, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
    if any(w in k for w in ('stone', 'rock', 'ash', 'char', 'grey', 'slate')): return toon.material(name, v, None, 'cel', t_dark=0.62, t_lit=0.95)
    return toon.material(name, v, None, 'cel')
from skin import Stick, loft, ball
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
ONLY = argv[argv.index('--only') + 1].split(',') if '--only' in argv else None
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2; rad = math.radians; TAU = 2 * math.pi
rnd = random.Random(19)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'planedl': '#c9a874', 'bark': '#5e4332', 'log': '#6e5540', 'logd': '#4e3b2c', 'iron': '#6f777f', 'irond': '#4a5058', 'thatch': '#bda258', 'thatchd': '#9a8140', 'turf': '#4e6a3a',
                 'straw': '#c9b05e', 'strawd': '#a88f44', 'stone': '#8a8478', 'stoned': '#6a655c', 'canvas': '#cbb892', 'canvasd': '#ab9772', 'linen': '#e2d8c2', 'woolg': '#8a8478', 'woolb': '#7d6a5a', 'madder': '#8a4a3a', 'earth': '#4a3d2e', 'bone': '#e6dcc6', 'shell': '#d9d2c4', 'clay': '#9a7352',
                 'ash': '#9a948a', 'char': '#1e1916', 'flame': '#ffb24a', 'hull': '#5a4030', 'hulll': '#7a5a40', 'water': '#5d7f8e', 'fish': '#8d9f96', 'cut': '#d9c28c', 'ring': '#b58e58', 'dark': '#2b2522'}.items():
        C[k] = kmat('y_' + k, k, v)
def obj(name, coll, bm, m, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def box(name, coll, m, c, size, rz=0.0, rx=0.0, ry=0.0, bevel=0.12):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); R = Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ R @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
    if bevel: bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(size) * bevel, segments=1, affect='EDGES')
    return obj(name, coll, bm, m)
def rod(S, p0, p1, r, m, r1=None): return S.chain([Vector(p0), Vector(p1)], (r, r1 if r1 is not None else r), None, m)
def disc(name, coll, m, c, r, normal, seg=16):
    q = Vector(normal).normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4(); bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=seg, radius=r)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ q, verts=bm.verts); return obj(name, coll, bm, m)
def quad(name, coll, m, pts, thick=0.03):
    bm = bmesh.new(); vs = [bm.verts.new(Vector(p)) for p in pts]; bm.faces.new(vs); o = obj(name, coll, bm, m); so = o.modifiers.new('Solid', 'SOLIDIFY'); so.thickness = thick; so.offset = 0; return o
def blob(name, coll, m, spheres, voxel=0.04, tufts=0, tuft_r=0.3):
    bm = bmesh.new(); allsp = list(spheres)
    for (c, r, s) in spheres:
        for _ in range(tufts):
            th, ph = U(0, TAU), U(0.15, 2.6); n = Vector((math.sin(ph) * math.cos(th) * s[0], math.sin(ph) * math.sin(th) * s[1], math.cos(ph) * s[2]))
            allsp.append(((c[0] + n.x * r * 0.92, c[1] + n.y * r * 0.92, c[2] + n.z * r * 0.92), r * tuft_r * U(0.8, 1.25), (1, 1, 1)))
    for (c, r, s) in allsp: bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((s[0], s[1], s[2], 1.0)))
    me = bpy.data.meshes.new(name + '_raw'); bm.to_mesh(me); bm.free(); tmp = bpy.data.objects.new(name + '_raw', me); coll.objects.link(tmp)
    rm = tmp.modifiers.new('Remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.use_smooth_shade = True
    sm = tmp.modifiers.new('Smooth', 'SMOOTH'); sm.factor = 0.5; sm.iterations = 1
    bpy.context.view_layer.update(); me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get())); bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
    me2.materials.append(m); o = bpy.data.objects.new(name, me2); coll.objects.link(o); return o
def stone(name, coll, m, c, size, n=14, flat=0.22, rz=0.0, cap=0.0, merge=12.0):
    pts = []
    for i in range(n):
        th, ph = U(0, TAU), math.acos(U(-1, 1)); r = U(0.72, 1.0); p = Vector((math.sin(ph) * math.cos(th) * r, math.sin(ph) * math.sin(th) * r, math.cos(ph) * r)); p.z = max(p.z, -1 + flat * 2)
        if cap: p.z = min(p.z, 1 - cap * 2)
        pts.append(p)
    for k in range(6): a = TAU * k / 6 + U(-0.2, 0.2); pts.append(Vector((math.cos(a) * U(0.8, 1.0), math.sin(a) * U(0.8, 1.0), -1 + flat * 2)))
    bm = bmesh.new()
    for p in pts: bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts[:]); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS'); bmesh.ops.dissolve_limit(bm, angle_limit=rad(merge), verts=bm.verts[:], edges=bm.edges[:])
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)) @ Matrix.Translation((0, 0, 1 - flat * 2)), verts=bm.verts)
    return obj(name, coll, bm, m)
def cut_face(name, coll, c, r, normal):
    n = Vector(normal).normalized(); disc(name + '_face', coll, C['cut'], Vector(c) + n * 0.003, r * 0.98, n); disc(name + '_ring', coll, C['ring'], Vector(c) + n * 0.006, r * 0.55, n)
def log_wall(S, x0, x1, y, z0, z1, r, m='log'):
    z = z0 + r
    while z < z1: S.chain([Vector((x0, y, z)), Vector((x1, y, z))], (r, r), None, m); z += r * 1.85
def thatch_roof(name, coll, cx, y0, y1, w, h0, rise, m='thatch', ridge='turf'):
    quad(name + '_w', coll, C[m], [(cx - w / 2, y0, h0), (cx - w / 2, y1, h0), (cx, y1, h0 + rise), (cx, y0, h0 + rise)], 0.08)
    quad(name + '_e', coll, C[m + 'd'], [(cx, y0, h0 + rise), (cx, y1, h0 + rise), (cx + w / 2, y1, h0), (cx + w / 2, y0, h0)], 0.08)
    S = Stick(); rod(S, (cx, y0 - 0.05, h0 + rise + 0.03), (cx, y1 + 0.05, h0 + rise + 0.03), 0.05, ridge)
    for sy in (y0 - 0.03, y1 + 0.03): rod(S, (cx - 0.16, sy, h0 + rise - 0.14), (cx + 0.16, sy, h0 + rise + 0.24), 0.022, 'woodd'); rod(S, (cx + 0.16, sy, h0 + rise - 0.14), (cx - 0.16, sy, h0 + rise + 0.24), 0.022, 'woodd')
    S.build(name + '_ridge', coll, C, subdiv=2)
    for sx in (-1, 1):                                                                                                                 # the straw's fringe at the eaves
        for k in range(int((y1 - y0) / 0.12)): y = y0 + 0.06 + k * 0.12; box(name + '_fr%d%d' % (sx > 0, k), coll, C[m], (cx + sx * (w / 2 + 0.03), y, h0 - 0.06 + U(-0.02, 0.02)), (0.06, 0.1, 0.12 + U(0, 0.05)), bevel=0.0)

# ---- the pieces ------------------------------------------------------------------------------------------------------
def storage_hut(coll):
    W, D, H0, H = 2.2, 1.7, 0.9, 1.3; S = Stick()
    for sx in (-1, 1):
        for sy in (-1, 1): rod(S, (sx * W * 0.4, sy * D * 0.4, 0), (sx * W * 0.4, sy * D * 0.4, H0), 0.09, 'woodd'); ball('cap%d%d' % (sx > 0, sy > 0), coll, C['planed'], (sx * W * 0.4, sy * D * 0.4, H0 + 0.02), 0.16, 1.0, 1.0, 0.25)   # the posts with their mouse caps
    log_wall(S, -W / 2, W / 2, -D / 2, H0 + 0.08, H0 + H, 0.075); log_wall(S, -W / 2, W / 2, D / 2, H0 + 0.08, H0 + H, 0.075, 'logd')
    for sx in (-1, 1):
        z = H0 + 0.08 + 0.075
        while z < H0 + H: S.chain([Vector((sx * W / 2, -D / 2 - 0.04, z)), Vector((sx * W / 2, D / 2 + 0.04, z))], (0.075, 0.075), None, 'logd'); z += 0.075 * 1.85
    for k in range(7): rod(S, (-W * 0.42, -D * 0.3 - k * 0.0, H0 - 0.1 - k * 0.14), (-W * 0.42, -D * 0.3, H0 - 0.1 - k * 0.14), 0.03, 'wood')   # (placeholder rungs replaced below)
    S.build('frame', coll, C, subdiv=2)
    box('floor', coll, C['planed'], (0, 0, H0 + 0.04), (W + 0.3, D + 0.3, 0.08))
    box('door', coll, C['woodd'], (0.15, -D / 2 - 0.02, H0 + 0.08 + H * 0.45), (0.55, 0.04, H * 0.85), bevel=0.0)
    L = Stick(); lx = -W * 0.2
    for dx in (-0.2, 0.2): rod(L, (lx + dx, -D / 2 - 0.7, 0), (lx + dx, -D / 2 - 0.1, H0 + 0.1), 0.03, 'wood')                                 # the ladder
    for k in range(5): t = (k + 0.5) / 5; rod(L, (lx - 0.2, -D / 2 - 0.7 + 0.6 * t, (H0 + 0.1) * t), (lx + 0.2, -D / 2 - 0.7 + 0.6 * t, (H0 + 0.1) * t), 0.02, 'planed')
    L.build('ladder', coll, C, subdiv=2)
    thatch_roof('roof', coll, 0, -D / 2 - 0.25, D / 2 + 0.25, W + 0.5, H0 + H + 0.02, 0.9)
    box('sack', coll, C['canvasd'], (W * 0.28, -D * 0.1, 0.22), (0.4, 0.3, 0.44), bevel=0.3)                                                   # a sack under it
    return dict(h=H0 + H + 1.1, w=W + 1.0, d=D + 0.9)
def boathouse(coll):
    W, D, H = 3.6, 4.4, 1.0; S = Stick()
    for sx in (-1, 1):
        for y in (-D / 2, 0, D / 2): rod(S, (sx * W / 2, y, 0), (sx * W / 2, y, H), 0.08, 'woodd')
    S.build('posts', coll, C, subdiv=2)
    for sx in (-1, 1): quad('wall%d' % (sx > 0), coll, C['planed' if sx < 0 else 'wood'], [(sx * W / 2, -D / 2, 0), (sx * W / 2, D / 2, 0), (sx * W / 2, D / 2, H), (sx * W / 2, -D / 2, H)], 0.06)
    quad('back', coll, C['wood'], [(-W / 2, D / 2, 0), (W / 2, D / 2, 0), (W / 2, D / 2, H), (-W / 2, D / 2, H)], 0.06)
    quad('gable', coll, C['planed'], [(-W / 2 - 0.1, D / 2, H), (W / 2 + 0.1, D / 2, H), (0, D / 2, H + 1.7)], 0.06)
    thatch_roof('roof', coll, 0, -D / 2 - 0.3, D / 2 + 0.2, W + 0.5, H, 1.7)
    hull = [((0, -D * 0.35, 0.12), 0.12, 0.1), ((0, -D * 0.2, 0.1), 0.5, 0.3), ((0, 0.0, 0.1), 0.62, 0.34), ((0, D * 0.2, 0.1), 0.5, 0.3), ((0, D * 0.35, 0.14), 0.12, 0.1)]           # the boat drawn up inside, stern to the south
    loft('boat', coll, C['hull'], [((c[0], c[1], c[2]), c[1 + 0], c[2]) for c in hull] if False else [((h[0][0], h[0][1], h[0][2]), h[1], h[2]) for h in hull], seg=14)
    box('keelblock', coll, C['woodd'], (0, -D * 0.1, 0.06), (0.9, 0.2, 0.12)); box('keelblock2', coll, C['woodd'], (0, D * 0.2, 0.06), (0.9, 0.2, 0.12))
    return dict(h=H + 2.0, w=W + 0.8, d=D + 0.5)
def beached_boat(coll):
    L = 4.0; tilt = rad(12)
    rings = [((-L / 2, 0, 0.1), 0.08, 0.14), ((-L * 0.32, 0, 0.18), 0.42, 0.4), ((-L * 0.1, 0, 0.2), 0.58, 0.46), ((L * 0.12, 0, 0.2), 0.58, 0.46), ((L * 0.33, 0, 0.18), 0.42, 0.4), ((L / 2, 0, 0.14), 0.08, 0.16)]
    bm = bmesh.new(); seg = 16; rows = []
    for (c, rx, rz) in rings:                                                                                           # the hull as half rings about the keel line (open above), listing to the south
        row = [bm.verts.new(Matrix.Rotation(tilt, 4, 'X') @ Vector((c[0], math.cos(a) * rx, c[2] + math.sin(a) * rz * -1 + rz))) for a in [math.pi * i / (seg - 1) for i in range(seg)]]; rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for i in range(seg - 1): bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    o = obj('hull', coll, bm, C['hull'], True); o.modifiers.new('Solid', 'SOLIDIFY').thickness = 0.05
    S = Stick()
    for k in range(3): z = 0.14 + k * 0.1; S.chain([Matrix.Rotation(tilt, 4, 'X') @ Vector((r[0][0], -r[1] * (0.6 + 0.15 * k), r[0][2] + z)) for r in rings], [(0.018, 0.018)] * 6, None, 'hulll')   # the strakes' lands on the near side
    for x in (-0.9, 0.6): S.chain([Matrix.Rotation(tilt, 4, 'X') @ Vector((x, -0.5, 0.5)), Matrix.Rotation(tilt, 4, 'X') @ Vector((x, 0.5, 0.5))], (0.04, 0.04), None, 'planed')                    # two thwarts
    S.chain([Vector((-1.2, -0.3, 0.62)), Vector((1.4, 0.4, 0.5))], (0.025, 0.02), None, 'planed'); S.build('fittings', coll, C, subdiv=2)                                                             # an oar across
    disc('blade', coll, C['planed'], (1.5, 0.43, 0.49), 0.1, (0, 0, 1), 10)
    return dict(h=0.9, w=L + 0.8, d=1.4)
def bee_skeps(coll):
    W = 1.3; box('bench', coll, C['planed'], (0, 0, 0.3), (W, 0.5, 0.05)); S = Stick()
    for sx in (-1, 1): rod(S, (sx * W * 0.42, -0.18, 0), (sx * W * 0.42, -0.18, 0.28), 0.035, 'wood'); rod(S, (sx * W * 0.42, 0.18, 0), (sx * W * 0.42, 0.18, 0.28), 0.035, 'wood'); rod(S, (sx * W * 0.46, 0.22, 0.3), (sx * W * 0.46, 0.22, 1.05), 0.035, 'wood')
    S.build('frame', coll, C, subdiv=2)
    for k, x in enumerate((-0.4, 0.0, 0.4)):
        rings = [((x, 0, 0.33), 0.18, 0.18), ((x, 0, 0.5), 0.19, 0.19), ((x, 0, 0.64), 0.15, 0.15), ((x, 0, 0.72), 0.06, 0.06)]
        loft('skep%d' % k, coll, C['straw' if k % 2 else 'strawd'], rings, seg=14)
        for j in range(4): S2 = Stick(); z = 0.36 + j * 0.09; r = (0.18, 0.19, 0.17, 0.12)[j]; S2.chain([Vector((x + math.cos(a) * r, math.sin(a) * r, z)) for a in [TAU * i / 12 for i in range(13)]], [(0.012, 0.012)] * 13, None, 'strawd'); S2.build('coil%d_%d' % (k, j), coll, C, subdiv=1)   # the coils
        box('hole%d' % k, coll, C['dark'], (x, -0.185, 0.37), (0.05, 0.01, 0.04), bevel=0.0)
    quad('lid', coll, C['planed'], [(-W / 2 - 0.1, -0.35, 1.0), (W / 2 + 0.1, -0.35, 1.0), (W / 2 + 0.1, 0.3, 1.1), (-W / 2 - 0.1, 0.3, 1.1)], 0.04)
    return dict(h=1.2, w=W + 0.6, d=0.7)
def washing_line(coll):
    W, H = 2.2, 1.6; S = Stick()
    for sx in (-1, 1): rod(S, (sx * W / 2, 0, 0), (sx * W / 2 + sx * 0.04, 0, H), 0.035, 'woodd')
    S.chain([Vector((-W / 2 + W * i / 8, 0, H - 0.04 - 0.1 * math.sin(math.pi * i / 8))) for i in range(9)], [(0.008, 0.008)] * 9, None, 'wood'); S.build('line', coll, C, subdiv=2)
    for k, (x, w, h, m) in enumerate(((-0.75, 0.5, 0.7, 'linen'), (-0.15, 0.4, 0.5, 'woolg'), (0.4, 0.6, 0.8, 'woolb'), (0.85, 0.3, 0.45, 'linen'))):
        top = H - 0.06 - 0.1 * math.sin(math.pi * (x + W / 2) / W)
        quad('cloth%d' % k, coll, C[m], [(x - w / 2, 0.02, top), (x + w / 2, 0.02, top), (x + w / 2 + 0.03, 0.06, top - h), (x - w / 2 - 0.04, 0.05, top - h + 0.05)], 0.02)
    return dict(h=H + 0.1, w=W + 0.6, d=0.4)
def quern(coll):
    box('block', coll, C['woodd'], (0, 0, 0.18), (0.5, 0.45, 0.36))
    loft('lower', coll, C['stone'], [((0, 0, 0.36), 0.2, 0.2), ((0, 0, 0.42), 0.21, 0.21)], seg=16); loft('upper', coll, C['stoned'], [((0, 0, 0.42), 0.19, 0.19), ((0, 0, 0.5), 0.18, 0.18)], seg=16)
    disc('eye', coll, C['dark'], (0, 0, 0.505), 0.03, (0, 0, 1), 10); S = Stick(); rod(S, (0.13, -0.08, 0.5), (0.16, -0.1, 0.82), 0.015, 'planed'); S.build('handle', coll, C, subdiv=2)
    ball('meal', coll, C['linen'], (0.15, 0.1, 0.44), 0.05, 1.3, 1.0, 0.4)
    return dict(h=0.95, w=0.9, d=0.5)
def spear_rack(coll):
    W = 1.2; S = Stick()
    for sx in (-1, 1): rod(S, (sx * W / 2, 0, 0), (sx * W / 2, 0, 1.2), 0.04, 'woodd')
    rod(S, (-W / 2 - 0.05, 0, 1.15), (W / 2 + 0.05, 0, 1.15), 0.03, 'wood'); rod(S, (-W / 2 - 0.05, 0, 0.35), (W / 2 + 0.05, 0, 0.35), 0.025, 'wood')
    for k in range(4): x = -0.45 + k * 0.3; rod(S, (x + 0.1, -0.1, 0.02), (x - 0.05, 0.02, 2.0), 0.018, 'planed')                                   # the spears leaning
    S.build('rack', coll, C, subdiv=2)
    for k in range(4): x = -0.45 + k * 0.3; box('head%d' % k, coll, C['iron'], (x - 0.06, 0.02, 2.1), (0.05, 0.025, 0.24), rz=0.1, bevel=0.0)
    return dict(h=2.4, w=W + 0.6, d=0.5)
def torch_bracket(coll):
    S = Stick(); rod(S, (0, 0, 1.4), (0.3, -0.02, 1.45), 0.02, 'iron'); rod(S, (0.02, 0, 1.2), (0.22, -0.01, 1.42), 0.015, 'iron'); rod(S, (0.3, -0.02, 1.35), (0.3, -0.02, 1.55), 0.028, 'irond')   # the ring
    rod(S, (0.3, -0.02, 1.3), (0.3, -0.02, 1.85), 0.022, 'wood'); S.build('bracket', coll, C, subdiv=2)
    ball('head', coll, C['char'], (0.3, -0.02, 1.88), 0.05, 1.0, 1.0, 1.4); ball('flame', coll, C['flame'], (0.3, -0.02, 2.0), 0.06, 1.0, 1.0, 1.6)
    return dict(h=2.2, w=0.9, d=0.4)
def midden(coll):
    R = 1.0
    blob('heap', coll, C['earth'], [((0, 0, -0.1), R, (1.0, 0.8, 0.38)), ((R * 0.3, R * 0.1, -0.05), R * 0.6, (1, 1, 0.45))], tufts=6, tuft_r=0.3)
    S = Stick()
    for k in range(6): a = U(0, TAU); r = U(0.1, 0.7); rod(S, (math.cos(a) * r, math.sin(a) * r * 0.8, 0.16 + U(0, 0.08)), (math.cos(a) * r + U(-0.25, 0.25), math.sin(a) * r * 0.8 + U(-0.15, 0.15), 0.14 + U(0, 0.1)), 0.02, 'bone')   # bones
    S.build('bones', coll, C, subdiv=2)
    for k in range(8): a = U(0, TAU); r = U(0.1, 0.8); disc('shell%d' % k, coll, C['shell'], (math.cos(a) * r, math.sin(a) * r * 0.8, 0.2 + U(0, 0.06)), U(0.04, 0.06), (0, -0.3, 1), 8)
    loft('pot', coll, C['clay'], [((-0.3, -0.4, 0.15), 0.1, 0.1), ((-0.3, -0.4, 0.3), 0.14, 0.14)], seg=10, arc=(0.3, 3.0), closed=False)                                     # a broken pot
    ball('skull', coll, C['bone'], (0.5, -0.3, 0.24), 0.08, 1.2, 1.0, 0.8)
    return dict(h=0.5, w=R * 2 + 0.6, d=R * 1.6)
def stall(coll):
    W, D, H = 1.6, 0.8, 0.9; S = Stick()
    for sx in (-1, 1):
        for sy in (-1, 1): rod(S, (sx * (W / 2 - 0.08), sy * (D / 2 - 0.08), 0), (sx * (W / 2 - 0.08), sy * (D / 2 - 0.08), H - 0.04), 0.03, 'wood')
        rod(S, (sx * W / 2, D / 2, 0), (sx * W / 2, D / 2, 1.9), 0.04, 'woodd'); rod(S, (sx * W / 2, -D / 2 - 0.3, 0), (sx * W / 2, -D / 2 - 0.3, 1.65), 0.035, 'woodd')
    S.build('frame', coll, C, subdiv=2)
    box('board', coll, C['planed'], (0, 0, H), (W, D, 0.05))
    quad('awning', coll, C['canvas'], [(-W / 2 - 0.05, -D / 2 - 0.35, 1.63), (W / 2 + 0.05, -D / 2 - 0.35, 1.63), (W / 2 + 0.05, D / 2 + 0.05, 1.9), (-W / 2 - 0.05, D / 2 + 0.05, 1.9)], 0.03)
    for k in range(4): x = -W / 2 + W * (k + 0.5) / 4; box('hem%d' % k, coll, C['canvasd'], (x, -D / 2 - 0.36, 1.56), (W / 4 - 0.03, 0.03, 0.1), bevel=0.0)
    for k in range(3): loft('bowl%d' % k, coll, C['clay'], [((-0.5 + k * 0.35, -0.15 + 0.1 * (k % 2), H + 0.03), 0.06, 0.06), ((-0.5 + k * 0.35, -0.15 + 0.1 * (k % 2), H + 0.09), 0.11, 0.11)], seg=12)
    ball('fish', coll, C['fish'], (0.5, 0.1, H + 0.06), 0.18, 1.8, 0.6, 0.45); box('basket', coll, C['strawd'], (0.45, -0.22, H + 0.09), (0.26, 0.2, 0.12), bevel=0.2)
    return dict(h=2.0, w=W + 0.8, d=D + 0.6)
def banner(coll):
    S = Stick(); rod(S, (0, 0, 0), (0.03, 0, 3.0), 0.04, 'woodd', 0.03); rod(S, (0.03, 0, 2.95), (0.03, 0, 3.0), 0.03, 'woodd'); S.build('pole', coll, C, subdiv=2)
    ball('knob', coll, C['iron'], (0.03, 0, 3.05), 0.05)
    quad('pennant', coll, C['madder'], [(0.06, -0.01, 2.95), (0.06, -0.01, 2.3), (0.9, -0.08, 2.75), (0.95, -0.1, 2.8)], 0.02)                                                  # the pennant blowing east
    return dict(h=3.2, w=1.6, d=0.4)
def sign_post(coll):
    S = Stick(); rod(S, (0, 0, 0), (0, 0, 1.8), 0.045, 'woodd'); S.build('post', coll, C, subdiv=2)
    box('board1', coll, C['planed'], (0.3, 0, 1.55), (0.6, 0.04, 0.14), rz=0.1); box('tip1', coll, C['planed'], (0.62, 0, 1.55), (0.1, 0.04, 0.1), rz=rad(45) + 0.1, bevel=0.0)
    box('board2', coll, C['planed'], (-0.26, 0.02, 1.3), (0.52, 0.04, 0.14), rz=-0.15); box('tip2', coll, C['planed'], (-0.54, 0.02, 1.3), (0.1, 0.04, 0.1), rz=rad(45) - 0.15, bevel=0.0)
    for k in range(3): box('cut%d' % k, coll, C['woodd'], (0.15 + k * 0.12, -0.021, 1.55), (0.02, 0.004, 0.07), rz=0.1, bevel=0.0)                                                  # marks cut in the boards
    return dict(h=2.0, w=1.6, d=0.4)
def fire_ring(coll):
    R = 0.45
    for k in range(9): a = TAU * k / 9 + U(-0.1, 0.1); stone('st%d' % k, coll, C['stone' if k % 3 else 'stoned'], (math.cos(a) * R, math.sin(a) * R * 0.85, 0), (0.12, 0.1, 0.09), n=11, flat=0.2, rz=a)
    blob('ash', coll, C['ash'], [((0, 0, -0.04), R * 0.65, (1.0, 0.85, 0.3))], voxel=0.03)
    S = Stick(); rod(S, (-0.3, 0.05, 0.08), (0.35, -0.05, 0.1), 0.06, 'char'); S.build('log', coll, C, subdiv=2); cut_face('end', coll, (0.35, -0.05, 0.1), 0.06, (1, -0.3, 0.2))
    return dict(h=0.3, w=R * 2 + 0.6, d=R * 1.8)

PIECES = {'storageHut': storage_hut, 'boathouse': boathouse, 'beachedBoat': beached_boat, 'beeSkeps': bee_skeps, 'washingLine': washing_line, 'quern': quern, 'spearRack': spear_rack, 'torchBracket': torch_bracket, 'midden': midden, 'stall': stall, 'banner': banner, 'signPost': sign_post, 'fireRing': fire_ring}
CREASE = {'fireRing': 118, 'midden': 100}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for name, fn in PIECES.items():
    if ONLY and name not in ONLY: continue
    rnd.seed(sum(ord(ch) for ch in name)); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 0.8 + cfg.get('d', 0) * 0.6; aim = H * 0.38
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(CREASE.get(name, 100))
    toon.piece_line(fs, at_colours=True)
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
    print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
