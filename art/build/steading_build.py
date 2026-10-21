"""The burnt steading's things as set pieces (2026-10-20; villages plan step 1, Thorgunna's steading on the starter island). The
hall's ruin, the hut, the plank house, the palisade and the gate are the building kit's and stay drawn; these are what stands
about them and is still the old drawn prop: the graves behind the hall, the trail stones from the beach, the charred debris of
the raid, and the yard's own things. Built on the studio's construction and rendered from the set pieces' camera as the camp
things were: 35 degrees above the ground, looking north, 4 px a game unit when packed, twice that here.

  graveMound_1..2   a low turf mound with a head stone at its north end; _2 longer, two stones
  graveThorgunna    Thorgunna's: a mound with a standing stone carved with a ring and a line of marks, a wreath of dry flowers
  trailStone_1..2   a cairn of stacked stones a knee high, the way from the wreck to the steading (varde)
  charredBeam_1..3  a blackened roof beam lying on the ground, one end burnt to a point, embers' grey on it
  burntHeap_1..2    a heap of burnt thatch and ash with a few charred sticks, pale ash on top
  brokenDoor        a door leaf torn off and lying, its planks split, an iron band bent
  scarecrow         two crossed poles, a sack head, a ragged tunic, a straw hand
  shieldRack        a rail on two posts with three plain wooden shields hung on it (no paint: the raid took the painted ones)
  dragonPost        a carved post a man high with a beast's head, weathered grey, a little askew
  flowerBed         a low wattle-edged bed of herbs and a few pale flowers
  haystack_1..2     a round stack of hay on a pole, a man high; _2 half used, cut flat on one side
  fishingNet        a net hung to dry between two poles, floats along its top
  fishWeir          a V of stakes with a wattle fence between, for the shallows
  woodenWell        the steading's well: the camp well again under its own name

  node tools/blender.js steading_build.py -- <out dir> [--only graveMound_1,scarecrow]
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
rnd = random.Random(9)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'grey': '#8a8478', 'greyd': '#6a655c', 'stone': '#66737a', 'stoned': '#56636a', 'moss': '#6b8c46', 'turf': '#577838', 'turfl': '#78994e',
                 'char': '#1e1916', 'chard': '#2c2522', 'ash': '#9a948a', 'ashl': '#c2bcb0', 'ember': '#7a4a2a', 'iron': '#8a9199', 'irond': '#5f666e', 'sack': '#a89470', 'cloth': '#7d6a5a', 'straw': '#c9b05e', 'strawd': '#a88f44',
                 'net': '#5e5a50', 'float': '#b08a5a', 'leaf': '#5a8c38', 'leafl': '#7aa848', 'flower': '#e6dcc6', 'flowerp': '#b58aa8', 'dry': '#9a8a60', 'water': '#5d7f8e', 'rope': '#9a846a'}.items():
        C[k] = toon.material('s_' + k, v, None, 'cel')
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
def blob(name, coll, m, spheres, voxel=0.04, tufts=0, tuft_r=0.25, smooth_it=1):
    bm = bmesh.new(); allsp = list(spheres)
    for (c, r, s) in spheres:
        for _ in range(tufts):
            th, ph = U(0, TAU), U(0.15, 2.6); n = Vector((math.sin(ph) * math.cos(th) * s[0], math.sin(ph) * math.sin(th) * s[1], math.cos(ph) * s[2]))
            allsp.append(((c[0] + n.x * r * 0.92, c[1] + n.y * r * 0.92, c[2] + n.z * r * 0.92), r * tuft_r * U(0.8, 1.25), (1, 1, 1)))
    for (c, r, s) in allsp: bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((s[0], s[1], s[2], 1.0)))
    me = bpy.data.meshes.new(name + '_raw'); bm.to_mesh(me); bm.free(); tmp = bpy.data.objects.new(name + '_raw', me); coll.objects.link(tmp)
    rm = tmp.modifiers.new('Remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel; rm.use_smooth_shade = True
    sm = tmp.modifiers.new('Smooth', 'SMOOTH'); sm.factor = 0.5; sm.iterations = smooth_it
    bpy.context.view_layer.update(); me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get())); bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
    me2.materials.append(m); o = bpy.data.objects.new(name, me2); coll.objects.link(o); return o
def stone(name, coll, m, c, size, n=14, flat=0.22, rz=0.0, cap=0.0, tilt=(0, 0), merge=12.0):
    pts = []
    for i in range(n):
        th, ph = U(0, TAU), math.acos(U(-1, 1)); r = U(0.72, 1.0); p = Vector((math.sin(ph) * math.cos(th) * r, math.sin(ph) * math.sin(th) * r, math.cos(ph) * r))
        p.z = max(p.z, -1 + flat * 2)
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
def strip(name, coll, m, pts, widths, thick=0.012, droop=0.0):
    bm = bmesh.new(); rows = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]); d.z = 0
        if d.length < 1e-6: d = Vector((1, 0, 0))
        n = Vector((-d.y, d.x, 0)).normalized(); w = widths[i]
        rows.append((bm.verts.new(p - n * w - Vector((0, 0, droop * w))), bm.verts.new(p + n * w - Vector((0, 0, droop * w)))))
    for (a0, b0), (a1, b1) in zip(rows, rows[1:]):
        try: bm.faces.new((a0, b0, b1, a1))
        except ValueError: pass
    o = obj(name, coll, bm, m, True); so = o.modifiers.new('Solid', 'SOLIDIFY'); so.thickness = thick; so.offset = 0; return o
def mound(name, coll, L, W, H, m='turf'):
    blob(name + '_earth', coll, C['chard'], [((0, 0, -H * 0.9), L / 2 * 1.04, (1.0, W / L * 1.08, H / (L / 2) * 1.2))], voxel=0.05)
    blob(name, coll, C[m], [((0, 0, -H * 0.6), L / 2, (1.0, W / L, H / (L / 2) * 1.6)), ((L * 0.1, 0, -H * 0.5), L * 0.32, (1.0, W / L * 1.1, H / (L / 2) * 1.5))], tufts=12, tuft_r=0.16)

# ---- the pieces ------------------------------------------------------------------------------------------------------
def grave_mound(coll, v):
    L, W, H = (1.9, 0.9, 0.26) if v == 0 else (2.2, 1.0, 0.3)
    mound('mound', coll, L, W, H)
    stone('head', coll, C['grey'], (0, L / 2 - 0.2, 0.05), (0.22, 0.1, 0.4), n=12, flat=0.15, cap=0.1, rz=rad(90), tilt=(rad(-6), 0))                       # the head stone, north
    if v == 1: stone('foot', coll, C['greyd'], (0.05, -L / 2 + 0.2, 0), (0.12, 0.08, 0.18), n=10, flat=0.15, cap=0.1, rz=rad(90), tilt=(rad(10), 0))
    for k in range(3): a = U(0, TAU); ball('fl%d' % k, coll, C['flowerp' if k else 'flower'], (math.cos(a) * 0.25, math.sin(a) * 0.5, H * 0.7), 0.03)
    return dict(h=H + 0.45, w=L + 0.6, d=W)
def grave_thorgunna(coll):
    L, W, H = 2.2, 1.1, 0.3; mound('mound', coll, L, W, H)
    stone('stone', coll, C['grey'], (0, L / 2 - 0.3, 0.08), (0.3, 0.13, 0.75), n=14, flat=0.12, cap=0.14, rz=rad(90), tilt=(rad(-3), rad(2)))              # the standing stone
    disc('ring', coll, C['greyd'], (0, L / 2 - 0.3 - 0.135, 1.1), 0.1, (0, -1, 0.1), 18); disc('ringin', coll, C['grey'], (0, L / 2 - 0.3 - 0.138, 1.1), 0.06, (0, -1, 0.1), 18)   # a ring carved on its face
    for k in range(5): box('mark%d' % k, coll, C['greyd'], (-0.14 + k * 0.07, L / 2 - 0.3 - 0.135, 0.8), (0.016, 0.004, 0.12), rz=U(-0.3, 0.3), bevel=0.0)   # a line of marks under it
    S = Stick()
    for k in range(10): a = TAU * k / 10; S.chain([Vector((math.cos(a) * 0.3, L / 2 - 0.62 + math.sin(a) * 0.2, H * 0.9 + 0.04)), Vector((math.cos(a + 0.6) * 0.3, L / 2 - 0.62 + math.sin(a + 0.6) * 0.2, H * 0.9 + 0.04))], (0.03, 0.03), None, 'dry')   # a wreath of dry flowers at its foot
    S.build('wreath', coll, C, subdiv=2)
    return dict(h=1.3, w=L + 0.6, d=W)
def trail_stone(coll, v):
    n = 6 if v == 0 else 8; z = 0.0; H = 0.0
    for k in range(n):
        s = 0.22 - k * 0.018; h = s * 0.55; stone('st%d' % k, coll, C['stone' if k % 2 else 'stoned'], (U(-0.03, 0.03), U(-0.03, 0.03), z), (s, s * U(0.8, 1.0), h), n=12, flat=0.2, cap=0.2, rz=U(0, TAU)); z += h * 1.5; H = z
    if v == 1: ball('moss', coll, C['moss'], (0.1, -0.12, 0.12), 0.08, 1.4, 1.0, 0.4)
    return dict(h=H + 0.1, w=0.9, d=0.5)
def charred_beam(coll, v):
    L = (2.4, 1.8, 3.0)[v]; S = Stick(); a = (0.15, -0.35, 0.05)[v]
    pts = [Vector((math.cos(a) * (-L / 2 + L * i / 4), math.sin(a) * (-L / 2 + L * i / 4), 0.08 + 0.02 * math.sin(i))) for i in range(5)]
    S.chain(pts, [(0.1, 0.1), (0.1, 0.1), (0.09, 0.09), (0.07, 0.07), (0.03, 0.03)], None, 'char')
    S.build('beam', coll, C, subdiv=2)
    for k in range(4): t = U(0.1, 0.8); p = pts[0] + (pts[4] - pts[0]) * t; ball('ash%d' % k, coll, C['ash'], (p.x + U(-0.04, 0.04), p.y + U(-0.04, 0.04), 0.14), U(0.03, 0.05), 1.4, 1.0, 0.5)   # grey ash on the top
    if v != 1: ball('ember', coll, C['ember'], (pts[3].x, pts[3].y, 0.12), 0.035, 1.2, 1.0, 0.6)
    for k in range(3): box('splinter%d' % k, coll, C['chard'], (U(-L / 2, L / 2) * 0.8, U(-0.3, 0.3), 0.015), (U(0.15, 0.3), 0.03, 0.03), rz=U(0, TAU))
    return dict(h=0.35, w=L + 0.8, d=0.7)
def burnt_heap(coll, v):
    R = 0.7 if v == 0 else 0.5
    blob('heap', coll, C['chard'], [((0, 0, -0.05), R, (1.1, 0.9, 0.42)), ((R * 0.3, -R * 0.2, 0.0), R * 0.6, (1, 1, 0.5))], tufts=8, tuft_r=0.3)
    blob('ash', coll, C['ash'], [((-R * 0.1, -R * 0.15, R * 0.22), R * 0.5, (1.2, 1.0, 0.35))], tufts=5, tuft_r=0.3)
    ball('ashl', coll, C['ashl'], (-R * 0.2, -R * 0.25, R * 0.3), R * 0.22, 1.4, 1.0, 0.3)
    S = Stick()
    for k in range(5 if v == 0 else 3): a = U(0, TAU); rod(S, (math.cos(a) * R * 0.3, math.sin(a) * R * 0.2, R * 0.25), (math.cos(a) * R * 1.1, math.sin(a) * R * 0.9, U(0.0, 0.15)), 0.025, 'char')   # charred sticks out of it
    S.build('sticks', coll, C, subdiv=2)
    return dict(h=R * 0.6 + 0.1, w=R * 2.6 + 0.4, d=R * 2)
def broken_door(coll):
    W, L = 0.8, 1.7; rz = rad(25)
    for k in range(4): box('plank%d' % k, coll, C['planed' if k % 2 else 'wood'], (-W / 2 + W / 8 + k * W / 4, (0.08 if k == 1 else 0), 0.03 + (0.02 if k == 2 else 0)), (W / 4 - 0.015, L - (0.3 if k == 3 else 0), 0.04), rz=rz + U(-0.05, 0.05))
    box('band', coll, C['iron'], (0, L * 0.25, 0.07), (W * 1.05, 0.06, 0.012), rz=rz + 0.1, bevel=0.0); box('band2', coll, C['irond'], (0.05, -L * 0.3, 0.065), (W * 0.9, 0.06, 0.012), rz=rz - 0.25, bevel=0.0)
    return dict(h=0.2, w=2.2, d=1.8)
def scarecrow(coll):
    S = Stick(); H = 1.9
    rod(S, (0, 0, 0), (0.03, 0, H), 0.035, 'woodd'); rod(S, (-0.75, 0.02, H * 0.72), (0.75, -0.02, H * 0.74), 0.028, 'woodd'); S.build('poles', coll, C, subdiv=2)
    ball('head', coll, C['sack'], (0.03, 0, H + 0.14), 0.16, 1.0, 0.9, 1.15); box('hat', coll, C['cloth'], (0.03, 0, H + 0.3), (0.42, 0.42, 0.03), rz=0.2)
    box('tunic', coll, C['cloth'], (0.02, 0, H * 0.55), (0.55, 0.28, H * 0.42), rz=0.05, bevel=0.2)
    for sx in (-1, 1): ball('hand%d' % sx, coll, C['straw'], (sx * 0.78, 0, H * 0.73), 0.07, 1.6, 1.0, 1.0)
    ball('crow', coll, C['char'], (0.6, -0.02, H * 0.74 + 0.1), 0.07, 1.6, 1.0, 1.0)
    return dict(h=H + 0.4, w=2.2, d=0.5)
def shield_rack(coll):
    S = Stick(); H = 1.5
    for sx in (-1, 1): rod(S, (sx * 0.85, 0, 0), (sx * 0.85, 0, H), 0.04, 'woodd')
    rod(S, (-0.9, 0, H - 0.05), (0.9, 0, H - 0.05), 0.035, 'wood'); S.build('frame', coll, C, subdiv=2)
    for k, x in enumerate((-0.55, 0.0, 0.55)):
        disc('shield%d' % k, coll, C['planed' if k % 2 else 'wood'], (x, -0.05, H - 0.5), 0.42, (0, -1, 0.12), 20); disc('rim%d' % k, coll, C['woodd'], (x, -0.053, H - 0.5), 0.44, (0, -1, 0.12), 20)
        ball('boss%d' % k, coll, C['iron'], (x, -0.09, H - 0.5), 0.08, 1.0, 0.6, 1.0)
        for j in range(3): box('plank%d_%d' % (k, j), coll, C['woodd'], (x - 0.28 + j * 0.28, -0.058, H - 0.5), (0.008, 0.004, 0.8), bevel=0.0)
    return dict(h=H + 0.1, w=2.6, d=0.5)
def dragon_post(coll):
    S = Stick(); H = 2.1; tilt = 0.04
    S.chain([Vector((0, 0, 0)), Vector((tilt * H * 0.5, 0, H * 0.5)), Vector((tilt * H, 0, H))], [(0.13, 0.13), (0.11, 0.11), (0.1, 0.1)], None, 'grey')
    S.build('post', coll, C, subdiv=2)
    for k in range(6): box('cut%d' % k, coll, C['greyd'], (tilt * H * (0.3 + k * 0.1) - 0.13, 0, H * (0.3 + k * 0.1)), (0.02, 0.06, 0.03), bevel=0.0)                     # the carving's cuts up the west face
    ball('head', coll, C['grey'], (tilt * H + 0.08, 0, H + 0.1), 0.17, 1.5, 1.0, 1.0); ball('snout', coll, C['grey'], (tilt * H + 0.34, 0, H + 0.06), 0.1, 1.4, 0.8, 0.8)   # the beast's head, looking east
    ball('eye', coll, C['char'], (tilt * H + 0.2, -0.13, H + 0.16), 0.03); ball('ear', coll, C['greyd'], (tilt * H - 0.02, 0, H + 0.3), 0.06, 0.6, 1.0, 1.4)
    for k in range(3): box('tooth%d' % k, coll, C['ashl'], (tilt * H + 0.36 + k * 0.03, -0.06 + k * 0.05, H - 0.02), (0.015, 0.015, 0.05), bevel=0.0)
    ball('moss', coll, C['moss'], (-0.1, -0.06, 0.25), 0.08, 1.0, 0.6, 1.4)
    return dict(h=H + 0.5, w=1.4, d=0.6)
def flower_bed(coll):
    L, W = 1.4, 0.7; S = Stick()
    for sy in (-1, 1): S.chain([Vector((-L / 2 + L * i / 6, sy * W / 2 + 0.02 * math.sin(i * 2), 0.06 + 0.02 * math.cos(i))) for i in range(7)], [(0.03, 0.03)] * 7, None, 'wood')   # the wattle edge
    for sx in (-1, 1): rod(S, (sx * L / 2, -W / 2, 0.06), (sx * L / 2, W / 2, 0.06), 0.03, 'wood')
    for k in range(8): x = -L / 2 + 0.1 + k * (L - 0.2) / 7; rod(S, (x, -W / 2, 0), (x, -W / 2, 0.14), 0.02, 'woodd'); rod(S, (x, W / 2, 0), (x, W / 2, 0.14), 0.02, 'woodd')
    S.build('edge', coll, C, subdiv=2)
    blob('earth', coll, C['chard'], [((0, 0, -0.1), L / 2 * 0.95, (1.0, W / L, 0.3))], voxel=0.05)
    cl = [((U(-L / 2 + 0.15, L / 2 - 0.15), U(-W / 2 + 0.12, W / 2 - 0.12), 0.12), U(0.09, 0.14), (1.2, 1.0, 0.7)) for _ in range(6)]
    blob('herbs', coll, C['leaf'], cl, tufts=6, tuft_r=0.3); blob('herbsl', coll, C['leafl'], [((c[0][0] - 0.03, c[0][1] - 0.04, c[0][2] + 0.06), c[1] * 0.6, (1, 1, 0.7)) for c in cl[:3]], tufts=3, tuft_r=0.3)
    for k in range(7): ball('fl%d' % k, coll, C['flower' if k % 3 else 'flowerp'], (U(-L / 2 + 0.15, L / 2 - 0.15), U(-W / 2 + 0.1, W / 2 - 0.1), U(0.24, 0.32)), 0.035, 1.0, 1.0, 0.7)
    return dict(h=0.5, w=L + 0.6, d=W)
def haystack(coll, v):
    R, H = 1.1, 2.0; S = Stick(); rod(S, (0, 0, 0), (0, 0, H + 0.4), 0.04, 'woodd'); S.build('pole', coll, C, subdiv=2)
    if v == 0: sp = [((0, 0, H * 0.28), R, (1.0, 0.95, 0.62)), ((0, 0, H * 0.58), R * 0.78, (1.0, 0.95, 0.75)), ((0.02, 0, H * 0.84), R * 0.42, (1, 1, 1.0)), ((0.02, 0, H * 1.02), R * 0.18, (1, 1, 1.4))]
    else: sp = [((-0.15, 0, H * 0.26), R * 0.9, (0.85, 0.95, 0.6)), ((-0.2, 0, H * 0.54), R * 0.62, (0.8, 0.95, 0.8)), ((-0.22, 0, H * 0.78), R * 0.3, (0.8, 1, 1.1))]
    blob('hay', coll, C['straw'], sp, tufts=22, tuft_r=0.17, voxel=0.05)
    blob('hayd', coll, C['strawd'], [((R * 0.4, R * 0.5, H * 0.3), R * 0.45, (1.0, 0.8, 0.7))], tufts=4, tuft_r=0.3)
    if v == 1: box('cut', coll, C['strawd'], (R * 0.55, 0, H * 0.4), (0.05, R * 1.4, H * 0.7), bevel=0.0)                                                              # the cut face, east side
    for k in range(5): a = U(-2.6, 0.4); ball('loose%d' % k, coll, C['straw'], (math.cos(a) * R * U(1.0, 1.3), math.sin(a) * R * U(0.8, 1.1), 0.04), 0.09, 1.4, 1.0, 0.4)
    return dict(h=H + 0.5, w=R * 2.8 + 0.4, d=R * 2)
def fishing_net(coll):
    S = Stick(); L, H = 2.2, 1.6
    for sx in (-1, 1): rod(S, (sx * L / 2, 0, 0), (sx * L / 2 - sx * 0.05, 0, H), 0.035, 'woodd')
    S.chain([Vector((-L / 2 + L * i / 8, 0, H - 0.05 - 0.08 * math.sin(math.pi * i / 8))) for i in range(9)], [(0.012, 0.012)] * 9, None, 'rope'); S.build('frame', coll, C, subdiv=2)
    N = Stick(); n = 11
    for i in range(n + 1):                                                                                            # the net: hanging cords, their ends ragged
        x = -L / 2 + 0.1 + (L - 0.2) * i / n; top = H - 0.08 - 0.08 * math.sin(math.pi * i / n); bot = 0.4 + 0.25 * math.sin(math.pi * i / n) + 0.1 * math.sin(i * 2.1)
        N.chain([Vector((x, 0.01, top)), Vector((x + 0.01, 0.015, (top + bot) / 2)), Vector((x + 0.02 * math.sin(i), 0.02, bot))], [(0.012, 0.012)] * 3, None, 'net')
    for j in range(5): z0 = H - 0.1 - j * 0.22; N.chain([Vector((-L / 2 + 0.1 + (L - 0.2) * i / 8, 0.012, z0 - 0.06 * math.sin(math.pi * i / 8) - j * 0.03 * math.sin(i))) for i in range(9)], [(0.011, 0.011)] * 9, None, 'net')   # and the cross cords
    N.build('net', coll, C, subdiv=1)
    for k in range(6): ball('float%d' % k, coll, C['float'], (-L / 2 + 0.3 + k * (L - 0.6) / 5, -0.02, H - 0.1), 0.04, 1.0, 1.0, 1.4)
    return dict(h=H + 0.1, w=L + 0.6, d=0.4)
def fish_weir(coll):
    S = Stick(); L = 2.6; a = rad(28)
    for sx in (-1, 1):
        for k in range(7): t = k / 6; x = sx * math.sin(a) * L * t; y = math.cos(a) * L * t; rod(S, (x, y, -0.3), (x + U(-0.02, 0.02), y, U(0.5, 0.7)), 0.03, 'woodd')
        pts = [Vector((sx * math.sin(a) * L * k / 12, math.cos(a) * L * k / 12, 0.0)) for k in range(13)]
        for z in (0.12, 0.28, 0.44): S.chain([Vector((p.x, p.y, z + 0.02 * math.sin(i * 1.7))) for i, p in enumerate(pts)], [(0.018, 0.018)] * 13, None, 'wood')          # the wattle between
    for k in range(5): rod(S, (U(-0.25, 0.25), U(-0.1, 0.15), -0.3), (U(-0.25, 0.25), U(-0.1, 0.2), U(0.5, 0.7)), 0.03, 'woodd')                                            # the trap at the point
    S.build('stakes', coll, C, subdiv=2)
    return dict(h=0.8, w=L * 1.2 + 0.6, d=L)

PIECES = {'graveMound_1': lambda c: grave_mound(c, 0), 'graveMound_2': lambda c: grave_mound(c, 1), 'graveThorgunna': grave_thorgunna, 'trailStone_1': lambda c: trail_stone(c, 0), 'trailStone_2': lambda c: trail_stone(c, 1),
          'charredBeam_1': lambda c: charred_beam(c, 0), 'charredBeam_2': lambda c: charred_beam(c, 1), 'charredBeam_3': lambda c: charred_beam(c, 2), 'burntHeap_1': lambda c: burnt_heap(c, 0), 'burntHeap_2': lambda c: burnt_heap(c, 1),
          'brokenDoor': broken_door, 'scarecrow': scarecrow, 'shieldRack': shield_rack, 'dragonPost': dragon_post, 'flowerBed': flower_bed, 'haystack_1': lambda c: haystack(c, 0), 'haystack_2': lambda c: haystack(c, 1), 'fishingNet': fishing_net, 'fishWeir': fish_weir}
CREASE = {'trailStone_1': 118, 'trailStone_2': 118, 'graveMound_1': 118, 'graveMound_2': 118, 'graveThorgunna': 118}
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
