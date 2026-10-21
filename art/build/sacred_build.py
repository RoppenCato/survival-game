"""The sacred and the stations as set pieces (2026-10-20; villages plan step 4, the second batch): what stands at a village's edge
and what its people work at, still the old drawn props. In the trees' hand, from the set pieces' camera: 35 degrees above the
ground, looking north, 4 px a game unit when packed, twice that here. Stations should read as workplaces: the hird will work
at them (the developer, 2026-10-20).

  runestone      a standing stone a man high with a serpent band cut in it, leaning a little, moss at the foot                    1.9 m tall
  burialMound    the grave mound beyond the fields: a long barrow with a kerb of stones and a standing stone at its head             2.9 m across
  cairn          a cairn of stones a hip high, the fells' marker                                                                   1.2 m across
  stoneShip      a ship setting: standing stones in the shape of a hull, the biggest at stem and stern                              2.4 m long
  lychGate       the churchyard's gate: two posts under a little shingle roof, a low gate between                                   1.2 m wide, 2.2 m tall
  wayCross       a wayside cross of stone on a step                                                                                1.2 m tall
  font           the font: a stone basin on a short pillar                                                                         0.5 m across
  altar          the altar: a stone slab on two blocks with a cloth and a candle                                                   0.9 m wide
  forge          the smith's forge: a stone hearth with a hood, the bellows at its side, the anvil on its block before it, tongs       2.0 m across
  furnace        the bloomery: a clay shaft furnace on a stone base with a tuyere hole, slag at its foot                            1.3 m across, 1.6 m tall
  charcoalPit    the clamp: a turfed mound of stacked wood with a smoke vent at the top and a ring of earth                           2.1 m across
  carverBench    the carver's bench: a low bench with a vice, a half-carved post on it, chips about                                  0.9 m long
  masonBench     the mason's bench: a banker with a block half dressed on it, mallet and chisel, stone dust                          1.3 m long
  watchtower     a timber watch platform on four legs with a ladder and a rail, a man's height and a half up                          1.5 m square, 3.2 m tall

  node tools/blender.js sacred_build.py -- <out dir> [--only forge,furnace]
  Writes <name>.png and meta.json (the origin's pixel, the pixels a metre), for tools/pieces_pack.js."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from skin import Stick, loft, ball
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
ONLY = argv[argv.index('--only') + 1].split(',') if '--only' in argv else None
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2; rad = math.radians; TAU = 2 * math.pi
rnd = random.Random(23)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'planedl': '#c9a874', 'grey': '#8a8478', 'greyd': '#6a655c', 'stone': '#7e7f84', 'stoned': '#5f6066', 'ashlar': '#a9a39a', 'ashlard': '#8a847a', 'shingle': '#6a5240', 'turf': '#577838', 'turfl': '#78994e', 'moss': '#6b8c46',
                 'clay': '#9a7352', 'clayd': '#7a5a40', 'iron': '#6f777f', 'irond': '#4a5058', 'char': '#1e1916', 'ember': '#c0602a', 'flame': '#ffb24a', 'slag': '#3a3336', 'leather': '#7a5a3a', 'cloth': '#e2d8c2', 'cut': '#d9c28c', 'ring': '#b58e58', 'dust': '#c9c2b4', 'dark': '#2b2522', 'earth': '#5a4a38', 'smoke': '#b8b4ac'}.items():
        C[k] = toon.material('q_' + k, v, None, 'cel')
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
def stone(name, coll, m, c, size, n=14, flat=0.22, rz=0.0, cap=0.0, tilt=(0, 0), merge=12.0):
    pts = []
    for i in range(n):
        th, ph = U(0, TAU), math.acos(U(-1, 1)); r = U(0.72, 1.0); p = Vector((math.sin(ph) * math.cos(th) * r, math.sin(ph) * math.sin(th) * r, math.cos(ph) * r)); p.z = max(p.z, -1 + flat * 2)
        if cap: p.z = min(p.z, 1 - cap * 2)
        pts.append(p)
    for k in range(6): a = TAU * k / 6 + U(-0.2, 0.2); pts.append(Vector((math.cos(a) * U(0.8, 1.0), math.sin(a) * U(0.8, 1.0), -1 + flat * 2)))
    if cap:
        for k in range(5): a = TAU * k / 5 + U(-0.2, 0.2); pts.append(Vector((math.cos(a) * U(0.5, 0.8), math.sin(a) * U(0.5, 0.8), 1 - cap * 2)))
    bm = bmesh.new()
    for p in pts: bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts[:]); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS'); bmesh.ops.dissolve_limit(bm, angle_limit=rad(merge), verts=bm.verts[:], edges=bm.edges[:])
    R = Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(tilt[0], 4, 'X') @ Matrix.Rotation(tilt[1], 4, 'Y')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ R @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)) @ Matrix.Translation((0, 0, 1 - flat * 2)), verts=bm.verts)
    return obj(name, coll, bm, m)
def cut_face(name, coll, c, r, normal):
    n = Vector(normal).normalized(); disc(name + '_face', coll, C['cut'], Vector(c) + n * 0.003, r * 0.98, n); disc(name + '_ring', coll, C['ring'], Vector(c) + n * 0.006, r * 0.55, n)
def serpent(coll, name, c, r, m='greyd'):
    """a serpent band cut in a stone's face at c (the face looks south): a loop of the band with a head"""
    S = Stick(); pts = [Vector((c[0] + math.cos(a) * r * (1 + 0.15 * math.sin(3 * a)), c[1], c[2] + math.sin(a) * r * 1.3 * (1 + 0.1 * math.cos(2 * a)))) for a in [TAU * i / 20 for i in range(21)]]
    S.chain(pts, [(0.02, 0.02)] * 21, None, m); S.build(name, coll, C, subdiv=1); ball(name + '_head', coll, C[m], (pts[0].x + 0.03, c[1], pts[0].z), 0.04, 1.4, 1.0, 1.0)

# ---- the sacred ----------------------------------------------------------------------------------------------------------
def runestone(coll):
    H = 1.9; stone('stone', coll, C['grey'], (0, 0, 0.1), (0.4, 0.16, H / 2), n=16, flat=0.1, cap=0.12, rz=0, tilt=(rad(-4), rad(3)))
    serpent(coll, 'band', (0.02, -0.17, 1.05), 0.22); ball('moss', coll, C['moss'], (-0.2, -0.1, 0.15), 0.1, 1.2, 1.0, 0.6)
    return dict(h=H + 0.2, w=1.2, d=0.6)
def burial_mound(coll):
    L, W, H = 2.9, 1.8, 0.7
    blob('earth', coll, C['earth'], [((0, 0, -H * 0.9), L / 2 * 1.04, (1.0, W / L * 1.06, H / (L / 2) * 1.2))], voxel=0.05)
    blob('mound', coll, C['turf'], [((0, 0, -H * 0.6), L / 2, (1.0, W / L, H / (L / 2) * 1.6)), ((L * 0.1, 0, -H * 0.5), L * 0.32, (1.0, W / L * 1.1, H / (L / 2) * 1.5))], tufts=14, tuft_r=0.15)
    for k in range(12): a = TAU * k / 12; stone('kerb%d' % k, coll, C['grey' if k % 2 else 'greyd'], (math.cos(a) * L / 2 * 1.02, math.sin(a) * W / 2 * 1.02, 0), (0.14, 0.12, 0.12), n=10, flat=0.2, rz=a)   # the kerb
    stone('head', coll, C['grey'], (0, W / 2 - 0.3, H * 0.4), (0.22, 0.1, 0.55), n=12, flat=0.1, cap=0.12, rz=rad(90), tilt=(rad(-6), 0))
    return dict(h=H + 1.0, w=L + 0.6, d=W)
def cairn(coll):
    z = 0.0; H = 0
    for k in range(8): s = 0.32 - k * 0.028; h = s * 0.5; stone('st%d' % k, coll, C['stone' if k % 2 else 'stoned'], (U(-0.04, 0.04), U(-0.04, 0.04), z), (s, s * U(0.8, 1.0), h), n=12, flat=0.2, cap=0.2, rz=U(0, TAU)); z += h * 1.5; H = z
    for k in range(5): a = U(0, TAU); stone('foot%d' % k, coll, C['stoned'], (math.cos(a) * U(0.35, 0.5), math.sin(a) * U(0.3, 0.45), 0), (0.08, 0.07, 0.05), n=9, flat=0.2)
    return dict(h=H + 0.1, w=1.4, d=1.0)
def stone_ship(coll):
    L, W = 2.4, 1.0
    for k in range(12):
        t = k / 11; x = -L / 2 + L * t; y = (W / 2) * math.sin(math.pi * t); big = k in (0, 11); h = 0.5 if big else 0.22 + 0.1 * math.sin(math.pi * t)
        for sy in ((1,) if big else (1, -1)): stone('st%d_%d' % (k, sy > 0), coll, C['grey' if (k + sy) % 2 else 'greyd'], (x, sy * y, 0), (0.12, 0.08, h), n=12, flat=0.12, cap=0.1, rz=U(-0.2, 0.2), tilt=(U(-0.08, 0.08), U(-0.08, 0.08)))
    return dict(h=1.2, w=L + 0.8, d=W + 0.4)
def lych_gate(coll):
    W, H = 1.2, 1.7; S = Stick()
    for sx in (-1, 1): rod(S, (sx * W / 2, 0, 0), (sx * W / 2, 0, H), 0.06, 'woodd'); rod(S, (sx * W / 2, 0, H), (sx * W / 2, 0.7, H + 0.02), 0.05, 'woodd'); rod(S, (sx * W / 2, 0.7, 0), (sx * W / 2, 0.7, H), 0.06, 'woodd')
    rod(S, (-W / 2 - 0.05, 0, H), (W / 2 + 0.05, 0, H), 0.05, 'wood'); rod(S, (-W / 2 - 0.05, 0.7, H), (W / 2 + 0.05, 0.7, H), 0.05, 'wood')
    for sx in (-1, 1): rod(S, (sx * (W / 2 - 0.06), 0.02, 0), (sx * (W / 2 - 0.06), 0.02, 0.8), 0.03, 'wood')                                           # the low gate between
    for z in (0.3, 0.7): rod(S, (-W / 2 + 0.06, 0.02, z), (W / 2 - 0.06, 0.02, z), 0.025, 'planed')
    rod(S, (-W / 2 + 0.08, 0.025, 0.25), (W / 2 - 0.08, 0.025, 0.75), 0.02, 'planed'); S.build('frame', coll, C, subdiv=2)
    quad('roof_w', coll, C['shingle'], [(-W / 2 - 0.25, -0.2, H - 0.02), (-W / 2 - 0.25, 0.9, H - 0.02), (0, 0.9, H + 0.5), (0, -0.2, H + 0.5)], 0.05)
    quad('roof_e', coll, C['woodd'], [(0, -0.2, H + 0.5), (0, 0.9, H + 0.5), (W / 2 + 0.25, 0.9, H - 0.02), (W / 2 + 0.25, -0.2, H - 0.02)], 0.05)
    return dict(h=H + 0.7, w=W + 1.0, d=1.1)
def way_cross(coll):
    box('step', coll, C['ashlard'], (0, 0, 0.1), (0.7, 0.6, 0.2)); box('step2', coll, C['ashlar'], (0, 0, 0.27), (0.45, 0.4, 0.14))
    box('shaft', coll, C['ashlar'], (0, 0, 0.75), (0.14, 0.12, 0.85)); box('arm', coll, C['ashlar'], (0, 0, 1.0), (0.5, 0.12, 0.13)); box('top', coll, C['ashlar'], (0, 0, 1.24), (0.14, 0.12, 0.14))
    ball('moss', coll, C['moss'], (0.2, -0.25, 0.22), 0.07, 1.3, 1.0, 0.5)
    return dict(h=1.5, w=1.2, d=0.7)
def font(coll):
    loft('base', coll, C['ashlard'], [((0, 0, 0), 0.26, 0.26), ((0, 0, 0.12), 0.22, 0.22)], seg=12); loft('pillar', coll, C['ashlar'], [((0, 0, 0.12), 0.12, 0.12), ((0, 0, 0.6), 0.13, 0.13)], seg=12)
    loft('basin', coll, C['ashlar'], [((0, 0, 0.6), 0.16, 0.16), ((0, 0, 0.85), 0.27, 0.27), ((0, 0, 0.9), 0.26, 0.26)], seg=14); disc('water', coll, C['stoned'], (0, 0, 0.86), 0.2, (0, 0, 1), 14)
    return dict(h=1.0, w=0.9, d=0.6)
def altar(coll):
    for sx in (-1, 1): box('block%d' % (sx > 0), coll, C['ashlard'], (sx * 0.3, 0, 0.4), (0.22, 0.4, 0.8))
    box('slab', coll, C['ashlar'], (0, 0, 0.85), (1.0, 0.5, 0.1)); box('cloth', coll, C['cloth'], (0, 0, 0.91), (0.7, 0.52, 0.02), bevel=0.0)
    box('candle', coll, C['cloth'], (0.3, 0, 1.0), (0.04, 0.04, 0.18), bevel=0.0); ball('flame', coll, C['flame'], (0.3, 0, 1.12), 0.025, 1, 1, 1.6)
    box('book', coll, C['leather'], (-0.25, 0.02, 0.94), (0.22, 0.16, 0.05), rz=0.1)
    return dict(h=1.3, w=1.4, d=0.7)
# ---- the stations ----------------------------------------------------------------------------------------------------------
def forge(coll):
    box('hearth', coll, C['stone'], (0, 0.1, 0.4), (1.2, 0.8, 0.8), bevel=0.04)
    for k in range(10): box('st%d' % k, coll, C['stoned'], (-0.55 + (k % 5) * 0.27 + (0.13 if k >= 5 else 0), -0.31, 0.12 + (k // 5) * 0.3), (U(0.18, 0.24), 0.03, 0.22), bevel=0.0)   # the stones' joints on the south face
    blob('coals', coll, C['char'], [((0, 0.05, 0.84), 0.28, (1.3, 1.0, 0.35))], voxel=0.03); ball('glow', coll, C['ember'], (0.02, 0.0, 0.9), 0.09, 1.4, 1.0, 0.5)
    S = Stick()
    for sx in (-1, 1): rod(S, (sx * 0.5, 0.45, 0.8), (sx * 0.45, 0.45, 1.8), 0.04, 'woodd')
    S.build('posts', coll, C, subdiv=2)
    quad('hood', coll, C['planed'], [(-0.65, 0.5, 1.5), (0.65, 0.5, 1.5), (0.5, 0.0, 1.85), (-0.5, 0.0, 1.85)], 0.05)                                    # the plank hood over the fire
    box('bellows', coll, C['leather'], (0.95, 0.2, 0.6), (0.5, 0.3, 0.2), rz=0.1, bevel=0.3); box('nozzle', coll, C['irond'], (0.6, 0.15, 0.7), (0.3, 0.05, 0.05), bevel=0.0)
    S2 = Stick(); rod(S2, (-0.5, -0.8, 0), (-0.5, -0.8, 0.5), 0.2, 'woodd', 0.19); S2.build('block', coll, C, subdiv=2); cut_face('blocktop', coll, (-0.5, -0.8, 0.5), 0.2, (0, 0, 1))
    box('anvil', coll, C['iron'], (-0.5, -0.8, 0.62), (0.4, 0.14, 0.14), bevel=0.0); box('horn', coll, C['iron'], (-0.78, -0.8, 0.64), (0.18, 0.08, 0.08), ry=rad(10), bevel=0.0)
    S3 = Stick(); rod(S3, (-0.3, -0.5, 0.7), (0.1, -0.6, 0.72), 0.012, 'irond'); rod(S3, (-0.3, -0.52, 0.7), (0.1, -0.5, 0.72), 0.012, 'irond'); S3.build('tongs', coll, C, subdiv=1)
    return dict(h=2.0, w=2.6, d=1.6)
def furnace(coll):
    box('base', coll, C['stone'], (0, 0, 0.2), (1.1, 0.9, 0.4), bevel=0.05)
    loft('shaft', coll, C['clay'], [((0, 0, 0.4), 0.32, 0.3), ((0, 0, 1.0), 0.28, 0.26), ((0, 0, 1.5), 0.2, 0.19), ((0, 0, 1.6), 0.16, 0.15)], seg=14)
    disc('mouth', coll, C['dark'], (0, 0, 1.605), 0.1, (0, 0, 1), 12); box('tuyere', coll, C['dark'], (0, -0.31, 0.55), (0.12, 0.04, 0.1), bevel=0.0); ball('glow', coll, C['ember'], (0, -0.3, 0.55), 0.05, 1.0, 0.5, 0.8)
    for k in range(4): box('band%d' % k, coll, C['clayd'], (0, 0, 0.55 + k * 0.28), (0.66 - k * 0.06, 0.62 - k * 0.06, 0.03), bevel=0.0)
    for k in range(5): a = U(-2.8, -0.3); ball('slag%d' % k, coll, C['slag'], (math.cos(a) * U(0.5, 0.75), math.sin(a) * U(0.4, 0.6), 0.05), U(0.05, 0.09), 1.2, 1.0, 0.6)
    ball('smoke', coll, C['smoke'], (0.02, 0, 1.78), 0.11, 1.0, 1.0, 0.9); ball('smoke2', coll, C['smoke'], (0.08, -0.02, 1.98), 0.08)
    return dict(h=2.1, w=1.9, d=1.2)
def charcoal_pit(coll):
    R = 1.05
    blob('earth', coll, C['earth'], [((0, 0, -0.15), R * 1.1, (1.0, 0.9, 0.3))], voxel=0.05)
    blob('mound', coll, C['turf'], [((0, 0, -0.1), R, (1.0, 0.9, 0.7)), ((0, 0, 0.25), R * 0.6, (1.0, 0.9, 0.9))], tufts=10, tuft_r=0.2)
    S = Stick()
    for k in range(7): a = TAU * k / 7 + 0.3; rod(S, (math.cos(a) * R * 0.95, math.sin(a) * R * 0.85, 0.05), (math.cos(a) * R * 0.3, math.sin(a) * R * 0.25, R * 0.75), 0.04, 'woodd')   # the stacked wood showing through the turf
    S.build('wood', coll, C, subdiv=2)
    disc('vent', coll, C['dark'], (0, 0, R * 0.78), 0.1, (0, 0, 1), 12); ball('smoke', coll, C['smoke'], (0.04, 0, R * 0.95), 0.12, 1.0, 1.0, 0.8); ball('smoke2', coll, C['smoke'], (0.12, -0.03, R * 1.15), 0.08)
    for k in range(3): a = U(-2.8, -0.4); box('vent%d' % k, coll, C['dark'], (math.cos(a) * R * 0.8, math.sin(a) * R * 0.7, 0.3), (0.08, 0.06, 0.08), bevel=0.0)                      # the side vents
    return dict(h=R * 1.3, w=R * 2.6 + 0.4, d=R * 1.8)
def carver_bench(coll):
    L, W, H = 0.9, 0.4, 0.5; S = Stick()
    for sx in (-1, 1):
        for sy in (-1, 1): rod(S, (sx * L * 0.4, sy * W * 0.35, 0), (sx * L * 0.38, sy * W * 0.3, H - 0.03), 0.035, 'wood')
    S.build('legs', coll, C, subdiv=2); box('top', coll, C['planed'], (0, 0, H), (L, W, 0.06))
    box('vice', coll, C['woodd'], (L * 0.35, -W * 0.2, H + 0.12), (0.08, 0.14, 0.2), bevel=0.0); S2 = Stick(); rod(S2, (L * 0.3, -W * 0.2, H + 0.2), (L * 0.45, -W * 0.2, H + 0.2), 0.015, 'iron'); S2.build('screw', coll, C, subdiv=1)
    S3 = Stick(); rod(S3, (-L * 0.45, 0.02, H + 0.1), (L * 0.3, 0.0, H + 0.11), 0.07, 'wood'); S3.build('post', coll, C, subdiv=2)                                               # the half-carved post
    for k in range(5): box('cut%d' % k, coll, C['planedl'], (-L * 0.35 + k * 0.12, -0.05, H + 0.14), (0.06, 0.03, 0.03), rz=U(-0.3, 0.3), bevel=0.0)                              # the carving's cuts, pale
    for k in range(6): box('chip%d' % k, coll, C['planedl'], (U(-0.6, 0.6), U(-0.45, 0.0), 0.01), (U(0.04, 0.08), 0.02, 0.01), rz=U(0, TAU), bevel=0.0)
    box('gouge', coll, C['iron'], (0.1, 0.12, H + 0.05), (0.14, 0.02, 0.02), rz=0.4, bevel=0.0)
    return dict(h=H + 0.4, w=L + 0.8, d=W + 0.6)
def mason_bench(coll):
    L, W, H = 1.3, 0.6, 0.7
    for sx in (-1, 1): box('leg%d' % (sx > 0), coll, C['woodd'], (sx * L * 0.38, 0, H / 2), (0.1, W * 0.8, H))
    box('top', coll, C['planed'], (0, 0, H), (L, W, 0.08))
    box('block', coll, C['ashlar'], (-0.15, 0, H + 0.24), (0.6, 0.4, 0.4), bevel=0.03); box('dressed', coll, C['dust'], (-0.3, -0.2, H + 0.24), (0.28, 0.01, 0.4), bevel=0.0)        # the dressed face, pale
    for k in range(4): box('tool%d' % k, coll, C['greyd'], (-0.2 + k * 0.06, -0.205, H + 0.1 + k * 0.08), (0.02, 0.004, 0.06), rz=U(-0.2, 0.2), bevel=0.0)                         # tooling marks
    S = Stick(); rod(S, (0.45, -0.1, H + 0.06), (0.55, 0.15, H + 0.06), 0.02, 'wood'); S.build('haft', coll, C, subdiv=2); box('mallet', coll, C['woodd'], (0.58, 0.2, H + 0.1), (0.12, 0.12, 0.12))
    box('chisel', coll, C['iron'], (0.35, -0.2, H + 0.05), (0.2, 0.02, 0.02), rz=0.2, bevel=0.0)
    for k in range(5): ball('dust%d' % k, coll, C['dust'], (U(-0.7, 0.7), U(-0.5, -0.3), 0.01), U(0.04, 0.08), 1.4, 1.0, 0.25)
    return dict(h=H + 0.6, w=L + 0.8, d=W + 0.6)
def watchtower(coll):
    W, H = 1.5, 2.6; S = Stick()
    for sx in (-1, 1):
        for sy in (-1, 1): rod(S, (sx * W * 0.55, sy * W * 0.55, 0), (sx * W * 0.42, sy * W * 0.42, H), 0.07, 'woodd')
    for z in (1.0, H - 0.05):
        for sx in (-1, 1): rod(S, (sx * (W * 0.55 - (W * 0.13) * z / H), -W * 0.5, z), (sx * (W * 0.55 - (W * 0.13) * z / H), W * 0.5, z), 0.035, 'wood')
        for sy in (-1, 1): rod(S, (-W * 0.5, sy * (W * 0.55 - (W * 0.13) * z / H), z), (W * 0.5, sy * (W * 0.55 - (W * 0.13) * z / H), z), 0.035, 'wood')
    rod(S, (-W * 0.5, -W * 0.52, 0.1), (W * 0.4, -W * 0.45, H - 0.1), 0.03, 'wood')                                                                                        # a brace on the south face
    for sx in (-1, 1): rod(S, (sx * W * 0.42, -W * 0.42, H), (sx * W * 0.42, -W * 0.42, H + 0.9), 0.035, 'woodd'); rod(S, (sx * W * 0.42, W * 0.42, H), (sx * W * 0.42, W * 0.42, H + 0.9), 0.035, 'woodd')   # the rail posts
    for sy in (-1, 1): rod(S, (-W * 0.42, sy * W * 0.42, H + 0.85), (W * 0.42, sy * W * 0.42, H + 0.85), 0.03, 'wood')
    for sx in (-1, 1): rod(S, (sx * W * 0.42, -W * 0.42, H + 0.85), (sx * W * 0.42, W * 0.42, H + 0.85), 0.03, 'wood')
    L = Stick()
    for dx in (-0.2, 0.2): rod(L, (dx, -W * 0.5 - 0.9, 0), (dx, -W * 0.42, H + 0.05), 0.03, 'wood')
    for k in range(8): t = (k + 0.5) / 8; rod(L, (-0.2, -W * 0.5 - 0.9 + (W * 0.08 + 0.9) * t, (H + 0.05) * t), (0.2, -W * 0.5 - 0.9 + (W * 0.08 + 0.9) * t, (H + 0.05) * t), 0.02, 'planed')
    S.build('frame', coll, C, subdiv=2); L.build('ladder', coll, C, subdiv=2)
    box('deck', coll, C['planed'], (0, 0, H + 0.04), (W * 0.9, W * 0.9, 0.08))
    return dict(h=H + 1.2, w=W + 1.0, d=W + 1.2)

PIECES = {'runestone': runestone, 'burialMound': burial_mound, 'cairn': cairn, 'stoneShip': stone_ship, 'lychGate': lych_gate, 'wayCross': way_cross, 'font': font, 'altar': altar,
          'forge': forge, 'furnace': furnace, 'charcoalPit': charcoal_pit, 'carverBench': carver_bench, 'masonBench': mason_bench, 'watchtower': watchtower}
CREASE = {'runestone': 118, 'burialMound': 118, 'cairn': 118, 'stoneShip': 118}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for name, fn in PIECES.items():
    if ONLY and name not in ONLY: continue
    rnd.seed(sum(ord(ch) for ch in name)); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 0.8 + cfg.get('d', 0) * 0.6; aim = H * 0.38
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(CREASE.get(name, 100))
    toon.piece_line(fs)
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
    print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
