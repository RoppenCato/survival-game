"""The raid's set as set pieces (2026-10-20; villages plan step 6, for steps 5 to 8 of the developer's raid plan): what a raid
needs to see on the ground and had no picture. In the trees' hand, from the set pieces' camera: 35 degrees above the ground,
looking north, 4 px a game unit when packed, twice that here. The gate's states, the breach, the burnt walls and the lanterns are
in the kit and in earlier drops; these are the rest.

  ram               a trunk with four pairs of handles, carried by four: lying ready                                      3.6 m long
  sackPile          sacks of grain stacked three high against a wall: the storehouse full                                 1.6 m wide
  hangingFish       a rail under an eave with split fish and a side of meat hanging                                       1.8 m wide
  heavyChest        the church's or the jarl's silver chest: iron-bound, a heavy lock on the hasp                            0.9 m
  heavyChest_broken the same with the lock struck off, the hasp bent, the lid a hand open on silver                          0.9 m
  sack              a sack of food to carry: a tied sack standing                                                          0.6 m
  trapdoor_shut     a plank trapdoor in the floor with an iron ring                                                        1.0 m
  trapdoor_open     the same thrown open, the dark and the top of a ladder                                                  1.0 m
  cryptStairs       stone stairs going down between two walls into the dark                                                1.2 m wide
  coffinStone       a stone sarcophagus with a carved lid                                                                  2.0 m long
  coffinWood        a plank coffin on two trestles                                                                        1.9 m long
  reliquary         a small gabled chest of gilt bronze on a stone plinth                                                   0.6 m
  bones             a heap of skulls and long bones in a crypt's corner                                                     1.0 m
  ladder            a loft ladder leaning on a wall                                                                        2.6 m tall
  bucket            a bucket standing, full, for the bucket chain                                                           0.35 m
  karveBeached      the raider's karve lying off the sand, broadside, a plank down to the beach, shields on the rail, oars shipped, two sea chests   12 m long

  node tools/blender.js raid_build.py -- <out dir> [--only ram,sack]
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
rnd = random.Random(29)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'planedl': '#c9a874', 'bark': '#5e4332', 'hull': '#4e3a2c', 'hulll': '#6a5040', 'tar': '#2e2520', 'iron': '#6f777f', 'irond': '#4a5058', 'silver': '#d9dde2', 'gilt': '#c9a24a', 'giltd': '#9a7a3a',
                 'sack': '#a89470', 'sackd': '#8a7858', 'rope': '#9a846a', 'fish': '#8d9f96', 'fishl': '#e6dcc6', 'meat': '#8a4a3a', 'stone': '#7e7f84', 'stoned': '#5f6066', 'ashlar': '#a9a39a', 'ashlard': '#8a847a', 'bone': '#e6dcc6', 'boned': '#c9bfa8', 'dark': '#1e1916', 'water': '#5d7f8e',
                 'shield': '#b08a5a', 'shieldd': '#8a6a44', 'canvas': '#cbb892', 'cut': '#d9c28c', 'ring': '#b58e58'}.items():
        C[k] = kmat('r_' + k, k, v)
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
def cut_face(name, coll, c, r, normal):
    n = Vector(normal).normalized(); disc(name + '_face', coll, C['cut'], Vector(c) + n * 0.003, r * 0.98, n); disc(name + '_ring', coll, C['ring'], Vector(c) + n * 0.006, r * 0.55, n)
def blob(name, coll, m, spheres, voxel=0.035, tufts=0, tuft_r=0.3):
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
def chest(coll, L, W, H, broken=False):
    box('body', coll, C['woodd'], (0, 0, H / 2 - 0.02), (L, W, H - 0.06))
    for sx in (-1, 1): box('band%d' % sx, coll, C['iron'], (sx * L * 0.3, 0, H / 2), (0.06, W + 0.02, H + 0.04), bevel=0.0)
    box('band3', coll, C['iron'], (0, 0, H / 2), (0.06, W + 0.02, H + 0.04), bevel=0.0)
    for sx in (-1, 1): box('foot%d' % sx, coll, C['woodd'], (sx * (L / 2 - 0.06), 0, 0.03), (0.08, W * 0.9, 0.06))
    if not broken:
        box('lid', coll, C['wood'], (0, 0, H - 0.01), (L + 0.04, W + 0.04, 0.08)); box('hasp', coll, C['irond'], (0, -W / 2 - 0.015, H - 0.12), (0.1, 0.025, 0.16), bevel=0.0)
        box('lock', coll, C['irond'], (0, -W / 2 - 0.05, H - 0.2), (0.12, 0.06, 0.14), bevel=0.2); disc('keyhole', coll, C['dark'], (0, -W / 2 - 0.082, H - 0.2), 0.015, (0, -1, 0), 8)
    else:
        box('inside', coll, C['dark'], (0, 0, H - 0.06), (L - 0.1, W - 0.1, 0.012), bevel=0.0)
        for k in range(14): ball('coin%d' % k, coll, C['silver'], (U(-L * 0.4, L * 0.4), U(-W * 0.35, W * 0.35), H - 0.04), 0.022, 1.0, 1.0, 0.4)
        box('lid', coll, C['wood'], (0, W * 0.1, H + 0.06), (L + 0.04, W + 0.04, 0.08), rx=rad(22)); box('hasp', coll, C['irond'], (0.02, -W / 2 - 0.02, H - 0.1), (0.1, 0.025, 0.16), rx=rad(-35), bevel=0.0)
        box('lock', coll, C['irond'], (0.25, -W / 2 - 0.3, 0.05), (0.12, 0.06, 0.14), rz=0.6, ry=rad(70), bevel=0.2)                                         # the lock struck off, on the floor

def ram(coll):
    L = 3.6; S = Stick(); S.chain([Vector((-L / 2, 0, 0.16)), Vector((0, 0.01, 0.17)), Vector((L / 2, 0, 0.16))], [(0.16, 0.16), (0.17, 0.17), (0.15, 0.15)], None, 'bark')
    for k in range(4): x = -L * 0.3 + k * L * 0.2; rod(S, (x, -0.2, 0.17), (x, 0.2, 0.17), 0.025, 'planed')                                                 # the handles through it
    S.build('trunk', coll, C, subdiv=2)
    cut_face('end', coll, (L / 2, 0, 0.16), 0.15, (1, -0.2, 0.1)); box('head', coll, C['irond'], (-L / 2 + 0.02, 0, 0.16), (0.1, 0.3, 0.3), bevel=0.2)   # the iron shoe
    for k in range(3): S2 = Stick(); S2.chain([Vector((-L / 2 + 0.3 + k * 0.1 + math.cos(a) * 0.17, math.sin(a) * 0.17, 0.16 + math.sin(a) * 0.0)) for a in [TAU * i / 12 for i in range(13)]], [(0.015, 0.015)] * 13, None, 'rope'); S2.build('lash%d' % k, coll, C, subdiv=1)
    return dict(h=0.5, w=L + 0.6, d=0.7)
def sack_pile(coll):
    for row, n in ((0, 4), (1, 3), (2, 2)):
        for i in range(n): x = -(n - 1) / 2 * 0.4 + i * 0.4 + U(-0.02, 0.02); ball('s%d_%d' % (row, i), coll, C['sack' if (row + i) % 2 else 'sackd'], (x, U(-0.02, 0.02), 0.18 + row * 0.3), 0.22, 1.0, 0.75, 0.85)
        for i in range(n): x = -(n - 1) / 2 * 0.4 + i * 0.4; ball('tie%d_%d' % (row, i), coll, C['rope'], (x, -0.02, 0.18 + row * 0.3 + 0.2), 0.05, 1.0, 1.0, 0.6)
    return dict(h=1.1, w=2.0, d=0.5)
def hanging_fish(coll):
    S = Stick(); L = 1.8; rod(S, (-L / 2, 0, 1.9), (L / 2, 0, 1.9), 0.025, 'woodd')
    for sx in (-1, 1): rod(S, (sx * (L / 2 - 0.05), 0.0, 1.9), (sx * (L / 2 - 0.05), 0.08, 2.1), 0.02, 'wood')                                                 # the hooks to the eave
    S.build('rail', coll, C, subdiv=2)
    for i in range(6): x = -L / 2 + 0.2 + i * (L - 0.4) / 5; fl = U(0.4, 0.55); ball('fish%d' % i, coll, C['fishl' if i % 2 else 'fish'], (x, -0.01, 1.85 - fl / 2), fl / 2, 0.3, 0.1, 1.0); ball('head%d' % i, coll, C['fish'], (x, -0.02, 1.85 - fl + 0.05), 0.065, 1.0, 0.6, 0.9)
    ball('ham', coll, C['meat'], (L / 2 - 0.25, -0.02, 1.5), 0.17, 0.8, 0.6, 1.3); S3 = Stick(); rod(S3, (L / 2 - 0.25, -0.02, 1.88), (L / 2 - 0.25, -0.02, 1.66), 0.012, 'rope'); S3.build('rope', coll, C, subdiv=1)
    return dict(h=2.2, w=L + 0.6, d=0.4)
def heavy_chest(coll, broken=False): chest(coll, 0.9, 0.5, 0.55, broken); return dict(h=0.9 if broken else 0.65, w=1.5, d=0.6)
def sack(coll):
    ball('body', coll, C['sack'], (0, 0, 0.26), 0.25, 1.0, 0.85, 1.05); ball('neck', coll, C['sackd'], (0.02, 0, 0.56), 0.1, 1.0, 0.8, 0.9); ball('tie', coll, C['rope'], (0.02, 0, 0.52), 0.08, 1.0, 1.0, 0.5)
    return dict(h=0.7, w=0.9, d=0.5)
def trapdoor(coll, open_=False):
    W = 1.0; box('frame', coll, C['woodd'], (0, 0, 0.02), (W + 0.1, W + 0.1, 0.04), bevel=0.0); box('hole', coll, C['dark'], (0, 0, 0.025), (W - 0.04, W - 0.04, 0.01), bevel=0.0)
    if not open_:
        for k in range(4): box('plank%d' % k, coll, C['planed' if k % 2 else 'wood'], (-W / 2 + W / 8 + k * W / 4, 0, 0.05), (W / 4 - 0.015, W, 0.04), bevel=0.0)
        S = Stick(); S.chain([Vector((math.cos(a) * 0.07, -0.15 + math.sin(a) * 0.07, 0.08)) for a in [TAU * i / 10 for i in range(11)]], [(0.012, 0.012)] * 11, None, 'irond'); S.build('ring', coll, C, subdiv=1)
    else:
        for k in range(4): box('plank%d' % k, coll, C['planed' if k % 2 else 'wood'], (-W / 2 + W / 8 + k * W / 4, W / 2 + 0.02, 0.05 + W / 2 * 0.96), (W / 4 - 0.015, 0.04, W), bevel=0.0)                 # the leaf stood up at the back
        S = Stick()
        for dx in (-0.2, 0.2): rod(S, (dx, -0.05, -0.6), (dx, 0.0, 0.4), 0.03, 'wood')
        for k in range(3): rod(S, (-0.2, -0.04 + k * 0.012, -0.5 + k * 0.33), (0.2, -0.04 + k * 0.012, -0.5 + k * 0.33), 0.02, 'planed')
        S.build('ladder', coll, C, subdiv=2)
    return dict(h=1.2 if open_ else 0.15, w=W + 0.6, d=W)
def crypt_stairs(coll):
    W = 1.2
    for sx in (-1, 1): box('wall%d' % sx, coll, C['ashlar'], (sx * (W / 2 + 0.12), 0.3, 0.25), (0.24, 1.6, 0.5), bevel=0.03)
    for k in range(6): box('step%d' % k, coll, C['ashlard' if k % 2 else 'ashlar'], (0, -0.5 + k * 0.26, -0.03 - k * 0.09), (W, 0.26, 0.12 if k == 0 else 0.1), bevel=0.0)
    box('dark', coll, C['dark'], (0, 0.9, -0.6), (W, 0.6, 0.02), bevel=0.0); box('arch', coll, C['ashlard'], (0, 1.1, 0.45), (W + 0.5, 0.2, 0.2), bevel=0.0)
    return dict(h=0.7, w=W + 1.0, d=1.8)
def coffin_stone(coll):
    L, W, H = 2.0, 0.8, 0.6; box('body', coll, C['ashlar'], (0, 0, H / 2), (L, W, H), bevel=0.03); box('lid', coll, C['ashlard'], (0, 0, H + 0.08), (L + 0.08, W + 0.08, 0.16), bevel=0.2)
    for k in range(3): box('carve%d' % k, coll, C['ashlar'], (-0.5 + k * 0.5, 0, H + 0.17), (0.3, 0.3, 0.02), rz=0.78, bevel=0.0)                              # the lid's carved lozenges
    box('cross', coll, C['ashlar'], (-L / 2 - 0.011, 0, H * 0.5), (0.02, 0.1, 0.35), bevel=0.0); box('cross2', coll, C['ashlar'], (-L / 2 - 0.011, 0, H * 0.6), (0.02, 0.26, 0.09), bevel=0.0)
    return dict(h=H + 0.3, w=L + 0.6, d=W)
def coffin_wood(coll):
    L, W, H = 1.9, 0.6, 0.4; S = Stick()
    for x in (-0.6, 0.6):
        for sy in (-1, 1): rod(S, (x + (0.08 if x > 0 else -0.08), sy * 0.3, 0), (x, sy * 0.1, 0.5), 0.035, 'wood')
    S.build('trestles', coll, C, subdiv=2)
    bm = bmesh.new(); pts = [(-L / 2, -W * 0.35), (-L * 0.15, -W / 2), (L / 2, -W * 0.3), (L / 2, W * 0.3), (-L * 0.15, W / 2), (-L / 2, W * 0.35)]
    vb = [bm.verts.new(Vector((p[0], p[1], 0.5))) for p in pts]; vt = [bm.verts.new(Vector((p[0], p[1], 0.5 + H))) for p in pts]; n = len(pts)
    for i in range(n): bm.faces.new((vb[i], vb[(i + 1) % n], vt[(i + 1) % n], vt[i]))
    bm.faces.new(vb[::-1]); bm.faces.new(vt); obj('box', coll, bm, C['planed'])
    for k in range(2): box('band%d' % k, coll, C['iron'], (-0.4 + k * 0.8, 0, 0.5 + H / 2), (0.04, W + 0.04, H + 0.03), bevel=0.0)
    return dict(h=0.5 + H + 0.1, w=L + 0.6, d=W + 0.4)
def reliquary(coll):
    box('plinth', coll, C['ashlar'], (0, 0, 0.3), (0.5, 0.4, 0.6), bevel=0.03); box('top', coll, C['ashlard'], (0, 0, 0.63), (0.6, 0.5, 0.06))
    box('body', coll, C['gilt'], (0, 0, 0.8), (0.5, 0.26, 0.28), bevel=0.05)
    quad('roof_w', coll, C['giltd'], [(-0.27, -0.15, 0.94), (-0.27, 0.15, 0.94), (0, 0.15, 1.08), (0, -0.15, 1.08)], 0.02); quad('roof_e', coll, C['gilt'], [(0, -0.15, 1.08), (0, 0.15, 1.08), (0.27, 0.15, 0.94), (0.27, -0.15, 0.94)], 0.02)
    for k in range(3): ball('gem%d' % k, coll, C['dark'], (-0.14 + k * 0.14, -0.135, 0.8), 0.025, 1.0, 0.5, 1.0)
    S = Stick(); rod(S, (-0.25, 0, 1.08), (0.25, 0, 1.08), 0.015, 'gilt'); S.build('ridge', coll, C, subdiv=1)
    return dict(h=1.2, w=1.0, d=0.6)
def bones(coll):
    blob('heap', coll, C['boned'], [((0, 0, 0.0), 0.5, (1.0, 0.8, 0.4)), ((0.2, -0.1, 0.1), 0.3, (1, 1, 0.5))])
    for k in range(5): a = U(0, TAU); r = U(0.05, 0.4); ball('skull%d' % k, coll, C['bone'], (math.cos(a) * r, math.sin(a) * r * 0.8, 0.14 + U(0, 0.1)), 0.09, 1.0, 1.15, 0.95)
    S = Stick()
    for k in range(8): a = U(0, TAU); r = U(0.1, 0.5); rod(S, (math.cos(a) * r, math.sin(a) * r * 0.8, 0.1 + U(0, 0.12)), (math.cos(a) * r + U(-0.3, 0.3), math.sin(a) * r * 0.8 + U(-0.2, 0.2), 0.08 + U(0, 0.14)), 0.02, 'bone')
    S.build('long', coll, C, subdiv=2)
    return dict(h=0.5, w=1.6, d=1.0)
def ladder(coll):
    S = Stick(); H = 2.6; lean = 0.6
    for dx in (-0.2, 0.2): rod(S, (dx, 0, 0), (dx, lean, H), 0.03, 'wood')
    for k in range(8): t = (k + 0.5) / 8; rod(S, (-0.2, lean * t, H * t), (0.2, lean * t, H * t), 0.02, 'planed')
    S.build('ladder', coll, C, subdiv=2)
    return dict(h=H + 0.1, w=0.9, d=lean + 0.2)
def bucket(coll):
    loft('pail', coll, C['wood'], [((0, 0, 0), 0.12, 0.12), ((0, 0, 0.3), 0.14, 0.14)], seg=12); disc('water', coll, C['water'], (0, 0, 0.27), 0.125, (0, 0, 1), 12)
    for z in (0.06, 0.24): S = Stick(); S.chain([Vector((math.cos(a) * (0.12 + z * 0.07), math.sin(a) * (0.12 + z * 0.07), z)) for a in [TAU * i / 14 for i in range(15)]], [(0.012, 0.012)] * 15, None, 'irond'); S.build('hoop%d' % int(z * 100), coll, C, subdiv=1)
    S2 = Stick(); S2.chain([Vector((math.cos(a) * 0.14, 0, 0.3 + math.sin(a) * 0.14)) for a in [math.pi * i / 10 for i in range(11)]], [(0.008, 0.008)] * 11, None, 'iron'); S2.build('handle', coll, C, subdiv=1)
    return dict(h=0.5, w=0.7, d=0.4)
def karve(coll):
    L, B = 12.0, 2.6; S = Stick(); list_ = rad(8)
    xs = [-L / 2, -L * 0.42, -L * 0.3, -L * 0.15, 0.0, L * 0.15, L * 0.3, L * 0.42, L / 2]
    rings = [((x, 0, 0.3 + 0.55 * (abs(x) / (L / 2)) ** 3), B / 2 * max(0.08, 1 - (abs(x) / (L / 2)) ** 2.2), 0.7 + 0.4 * (abs(x) / (L / 2)) ** 2) for x in xs]
    bm = bmesh.new(); seg = 14; rows = []
    for (c, rx, rz) in rings: rows.append([bm.verts.new(Matrix.Rotation(list_, 4, 'X') @ Vector((c[0], math.cos(a) * rx, c[2] + rz - math.sin(a) * rz))) for a in [math.pi * i / (seg - 1) for i in range(seg)]])
    for a, b in zip(rows, rows[1:]):
        for i in range(seg - 1): bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    o = obj('hull', coll, bm, C['hull'], True); o.modifiers.new('Solid', 'SOLIDIFY').thickness = 0.08
    for k in range(5): z = 0.35 + k * 0.22; S.chain([Matrix.Rotation(list_, 4, 'X') @ Vector((c[0], -r[1] * (0.55 + 0.1 * k), c[2] + r[2] * (0.1 + 0.17 * k))) for c, r in [(rr[0], rr) for rr in rings]], [(0.025, 0.025)] * 9, None, 'hulll')   # the strakes' lands
    S.chain([Vector((-L / 2 - 0.1, 0, 0.3)), Vector((-L / 2 - 0.5, 0, 1.6)), Vector((-L / 2 - 0.4, 0, 2.6))], [(0.14, 0.12), (0.12, 0.1), (0.08, 0.06)], None, 'hull'); S.chain([Vector((L / 2 + 0.1, 0, 0.3)), Vector((L / 2 + 0.5, 0, 1.6)), Vector((L / 2 + 0.4, 0, 2.6))], [(0.14, 0.12), (0.12, 0.1), (0.08, 0.06)], None, 'hull')   # stem and stern posts
    ball('stemcurl', coll, C['hull'], (-L / 2 - 0.3, 0, 2.7), 0.16, 1.4, 0.6, 1.0); ball('sterncurl', coll, C['hull'], (L / 2 + 0.3, 0, 2.7), 0.16, 1.4, 0.6, 1.0)
    rod(S, (0.3, 0, 0.6), (0.4, 0.1, 5.5), 0.1, 'wood', 0.07); rod(S, (-2.4, 0.05, 5.0), (3.0, 0.15, 5.2), 0.07, 'wood')                                     # the mast and the yard, the sail furled
    S.build('fittings', coll, C, subdiv=2)
    loft('sail', coll, C['canvas'], [((-2.3, 0.05, 5.0), 0.12, 0.12), ((0.3, 0.1, 5.1), 0.22, 0.2), ((2.9, 0.15, 5.2), 0.12, 0.12)], seg=10)
    for k in range(9): x = -L * 0.38 + k * L * 0.095; disc('shield%d' % k, coll, C['shield' if k % 2 else 'shieldd'], (x, -B / 2 * max(0.3, 1 - (abs(x) / (L / 2)) ** 2.2) - 0.06, 1.35), 0.42, (0, -1, 0.15), 16); ball('boss%d' % k, coll, C['iron'], (x, -B / 2 * max(0.3, 1 - (abs(x) / (L / 2)) ** 2.2) - 0.1, 1.35), 0.07, 1.0, 0.6, 1.0)
    for k in range(6): x = -L * 0.3 + k * L * 0.12; S3 = Stick(); rod(S3, (x - 0.4, 0.6, 1.3), (x + 2.6, 0.8, 1.45), 0.035, 'planed'); S3.build('oar%d' % k, coll, C, subdiv=1)              # the oars shipped
    quad('plank', coll, C['planed'], [(-1.2, -B / 2 - 0.1, 1.2), (-0.7, -B / 2 - 0.1, 1.2), (-0.4, -B / 2 - 3.2, 0.05), (-0.9, -B / 2 - 3.2, 0.05)], 0.06)                       # the plank down to the sand
    chest_box = lambda nm, c: (box(nm, coll, C['woodd'], c, (0.8, 0.45, 0.45)), box(nm + 'b', coll, C['iron'], (c[0], c[1], c[2]), (0.05, 0.47, 0.47), bevel=0.0))
    chest_box('seachest1', (-3.0, 0.2, 1.1)); chest_box('seachest2', (2.0, 0.3, 1.1))
    return dict(h=6.0, w=L + 2.0, d=B + 3.5)

PIECES = {'ram': ram, 'sackPile': sack_pile, 'hangingFish': hanging_fish, 'heavyChest': lambda c: heavy_chest(c), 'heavyChest_broken': lambda c: heavy_chest(c, True), 'sack': sack, 'trapdoor_shut': lambda c: trapdoor(c), 'trapdoor_open': lambda c: trapdoor(c, True),
          'cryptStairs': crypt_stairs, 'coffinStone': coffin_stone, 'coffinWood': coffin_wood, 'reliquary': reliquary, 'bones': bones, 'ladder': ladder, 'bucket': bucket, 'karveBeached': karve}
CREASE = {'bones': 100, 'cryptStairs': 118, 'coffinStone': 118}
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
