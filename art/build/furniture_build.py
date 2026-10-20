"""The furniture of the first home as set pieces (2026-10-20; art plan item 6, the sixth and last of Robin's order): the bed,
the chest, the chair, the table, the bench, the crate and the barrel. Viking-age pieces in the benches' hand, built on the
studio's construction and rendered from the set pieces' camera: 35 degrees above the ground, looking north, 4 px a game unit
when packed, twice that here. Wood the key; the iron bands and the blanket the cool notes; the linen bone.

  bed      a box bed 1.9 by 0.9 m with carved head posts at the north end, a straw mattress, a pillow and a grey-blue wool blanket turned back
  chest    a six-board chest 0.9 by 0.45 m, knee high, two iron bands and a hasp; chest_open the same with the lid up (the game's it.open)
  chair    the Lund chair: four posts, a plank seat, two back uprights and a top rail, facing south
  table    a trestle table 1.4 by 0.7 m at 0.75 m with a bowl and a jug on it
  bench    a plank on two pairs of splayed legs, 1.4 m long, knee high
  crate    a slatted box 0.6 m on a side, the slats parted so the ink draws them
  barrel   staves bulging between two iron hoops, 0.6 m across, 0.8 m tall, a lid

  node tools/blender.js furniture_build.py -- <out dir> [--only bed,chest]
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
rnd = random.Random(3)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'planedl': '#c9a874', 'iron': '#8a9199', 'irond': '#5f666e', 'linen': '#e2d8c2', 'straw': '#c9b05e',
                 'wool': '#667a8c', 'woold': '#50626f', 'clay': '#9a7352', 'dark': '#2b2522'}.items():
        C[k] = toon.material('f_' + k, v, None, 'cel')
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
def hoop(S, c, r, z, rr, m, n=20): S.chain([Vector((c[0] + math.cos(TAU * i / n) * r, c[1] + math.sin(TAU * i / n) * r, z)) for i in range(n + 1)], (rr, rr), None, m)
def legs(S, L, W, h, r, m, splay=0.04, inset=0.08):
    for sx in (-1, 1):
        for sy in (-1, 1): rod(S, (sx * (L / 2 - inset + splay), sy * (W / 2 - inset + splay), 0), (sx * (L / 2 - inset), sy * (W / 2 - inset), h), r, m, r * 0.9)

# ---- the pieces ------------------------------------------------------------------------------------------------------
def bed(coll):
    L, W, H = 1.9, 0.9, 0.42; S = Stick()
    for sx in (-1, 1):
        rod(S, (sx * (W / 2 - 0.04), L / 2 - 0.04, 0), (sx * (W / 2 - 0.04), L / 2 - 0.04, 0.95), 0.045, 'woodd')                                        # the head posts
        ball('head%d' % sx, coll, C['woodd'], (sx * (W / 2 - 0.04), L / 2 - 0.1, 1.0), 0.07, 0.8, 1.5, 0.9)                                                   # carved animal heads, bowed forward
        rod(S, (sx * (W / 2 - 0.04), -L / 2 + 0.04, 0), (sx * (W / 2 - 0.04), -L / 2 + 0.04, H + 0.1), 0.04, 'woodd')                                       # the foot posts
    S.build('posts', coll, C, subdiv=2)
    for sx in (-1, 1): box('side%d' % sx, coll, C['wood'], (sx * W / 2, 0, H - 0.1), (0.04, L, 0.2))                                                       # the box sides
    for sy in (-1, 1): box('end%d' % sy, coll, C['wood'], (0, sy * L / 2, H - 0.1), (W, 0.04, 0.2))
    box('mattress', coll, C['straw'], (0, 0, H + 0.03), (W - 0.1, L - 0.1, 0.1))
    box('blanket', coll, C['wool'], (0, -0.2, H + 0.1), (W - 0.06, L - 0.75, 0.06), bevel=0.3)                                                             # the blanket, turned back at the head
    box('fold', coll, C['woold'], (0, L / 2 - 0.75, H + 0.13), (W - 0.06, 0.18, 0.05), bevel=0.3)
    ball('pillow', coll, C['linen'], (0, L / 2 - 0.3, H + 0.14), 0.22, 1.4, 1.0, 0.45)
    return dict(h=1.05, w=W + 0.7, d=L)
def chest(coll, open=False):
    L, W, H = 0.9, 0.45, 0.5
    box('body', coll, C['wood'], (0, 0, H / 2 - 0.02), (L, W, H - 0.06))
    if open:                                                                                                                                              # the lid stood up behind, the dark inside showing (the game's it.open)
        box('inside', coll, C['dark'], (0, 0, H - 0.05), (L - 0.08, W - 0.08, 0.012), bevel=0.0)
        box('lid', coll, C['planed'], (0, W / 2 + 0.07, H - 0.03 + (W + 0.04) / 2 * 0.96), (L + 0.04, 0.07, W + 0.04), rx=rad(15))
    else: box('lid', coll, C['planed'], (0, 0, H - 0.01), (L + 0.04, W + 0.04, 0.07))
    for sx in (-1, 1): box('band%d' % sx, coll, C['iron'], (sx * L * 0.3, 0, H / 2), (0.05, W + 0.02, H + 0.04), bevel=0.0)                                 # the iron bands
    box('hasp', coll, C['irond'], (0, -W / 2 - 0.012, H - 0.12), (0.08, 0.02, 0.14), bevel=0.0)
    for sx in (-1, 1): box('foot%d' % sx, coll, C['woodd'], (sx * (L / 2 - 0.06), 0, 0.03), (0.08, W * 0.9, 0.06))
    return dict(h=(H + W + 0.1) if open else (H + 0.1), w=L + 0.6, d=W)
def chair(coll):
    W, D, Hs, Hb = 0.46, 0.44, 0.45, 0.95; S = Stick()
    legs(S, W, D, Hs, 0.025, 'wood', splay=0.0)
    for sx in (-1, 1): rod(S, (sx * (W / 2 - 0.08), D / 2 - 0.08, Hs), (sx * (W / 2 - 0.06), D / 2 - 0.02, Hb), 0.025, 'wood')                           # the back uprights, leaning back a little
    rod(S, (-W / 2 + 0.06, D / 2 - 0.02, Hb - 0.02), (W / 2 - 0.06, D / 2 - 0.02, Hb - 0.02), 0.03, 'woodd')                                                # the top rail
    rod(S, (-W / 2 + 0.07, D / 2 - 0.05, Hs + 0.22), (W / 2 - 0.07, D / 2 - 0.05, Hs + 0.22), 0.02, 'wood')                                                 # a mid rail
    for sy in (-1, 1): rod(S, (-W / 2 + 0.08, sy * (D / 2 - 0.08), 0.18), (W / 2 - 0.08, sy * (D / 2 - 0.08), 0.18), 0.015, 'wood')                        # stretchers
    S.build('frame', coll, C, subdiv=2)
    box('seat', coll, C['planed'], (0, 0, Hs), (W, D, 0.035))
    return dict(h=Hb + 0.05, w=W + 0.6, d=D)
def table(coll):
    L, W, H, T = 1.4, 0.7, 0.75, 0.05; S = Stick()
    for x in (-0.5, 0.5):                                                                                                                                 # two trestles
        for sy in (-1, 1): rod(S, (x + (0.06 if x > 0 else -0.06), sy * 0.3, 0), (x, sy * 0.08, H - T), 0.035, 'wood', 0.03)
        rod(S, (x, -0.2, (H - T) * 0.45), (x, 0.2, (H - T) * 0.45), 0.028, 'woodd')
    rod(S, (-0.5, 0, 0.3), (0.5, 0, 0.3), 0.03, 'woodd')                                                                                                   # the stretcher
    S.build('frame', coll, C, subdiv=2)
    box('top', coll, C['planed'], (0, 0, H - T / 2), (L, W, T))
    loft('bowl', coll, C['clay'], [((0.3, -0.05, H), 0.07, 0.07), ((0.3, -0.05, H + 0.07), 0.13, 0.13)], seg=14)                                           # a bowl
    loft('jug', coll, C['clay'], [((-0.25, 0.12, H), 0.07, 0.07), ((-0.25, 0.12, H + 0.14), 0.1, 0.1), ((-0.25, 0.12, H + 0.26), 0.05, 0.05), ((-0.25, 0.12, H + 0.3), 0.06, 0.06)], seg=14)   # a jug
    return dict(h=H + 0.35, w=L + 0.6, d=W)
def bench(coll):
    L, W, H = 1.4, 0.3, 0.45; S = Stick()
    for x in (-0.5, 0.5):
        for sy in (-1, 1): rod(S, (x, sy * 0.2, 0), (x, sy * 0.1, H - 0.03), 0.03, 'wood', 0.028)
    rod(S, (-0.5, 0, 0.2), (0.5, 0, 0.2), 0.025, 'woodd')
    S.build('frame', coll, C, subdiv=2)
    box('seat', coll, C['planed'], (0, 0, H - 0.02), (L, W, 0.045))
    return dict(h=H + 0.05, w=L + 0.6, d=W)
def crate(coll):
    A = 0.6; g = 0.025
    for k in range(3):                                                                                                                                     # slats parted, each face
        z = 0.1 + k * (A - 0.1) / 3 + 0.08
        for sy in (-1, 1): box('f%d_%d' % (k, sy), coll, C['planed' if sy < 0 else 'wood'], (0, sy * A / 2, z), (A, 0.03, (A - 0.1) / 3 - g))
        for sx in (-1, 1): box('s%d_%d' % (k, sx), coll, C['wood'], (sx * A / 2, 0, z), (0.03, A - 0.06, (A - 0.1) / 3 - g))
    for sx in (-1, 1):
        for sy in (-1, 1): box('post%d%d' % (sx, sy), coll, C['woodd'], (sx * (A / 2 - 0.03), sy * (A / 2 - 0.03), A / 2), (0.05, 0.05, A))
    box('lid', coll, C['planed'], (0, 0, A + 0.015), (A + 0.02, A + 0.02, 0.03))
    return dict(h=A + 0.1, w=A + 0.7, d=A)
def barrel(coll):
    R, H = 0.3, 0.8; S = Stick()
    loft('staves', coll, C['wood'], [((0, 0, 0.0), R * 0.9, R * 0.9), ((0, 0, H * 0.3), R * 1.02, R * 1.02), ((0, 0, H * 0.7), R * 1.02, R * 1.02), ((0, 0, H), R * 0.9, R * 0.9)], seg=18)
    for i in range(9):                                                                                                                                     # the stave lines as thin ridges
        a = TAU * i / 9 + 0.1; S.chain([Vector((math.cos(a) * r, math.sin(a) * r, z)) for r, z in ((R * 0.9, 0.02), (R * 1.03, H * 0.3), (R * 1.03, H * 0.7), (R * 0.9, H - 0.02))], [(0.012, 0.012)] * 4, None, 'woodd')
    hoop(S, (0, 0), R * 1.0, H * 0.2, 0.02, 'iron'); hoop(S, (0, 0), R * 1.0, H * 0.8, 0.02, 'iron')
    S.build('ridges', coll, C, subdiv=2)
    disc('lid', coll, C['planed'], (0, 0, H + 0.005), R * 0.88, (0, 0, 1), 18)
    return dict(h=H + 0.08, w=R * 2 + 0.6, d=R * 2)

PIECES = {'bed': bed, 'chest': chest, 'chest_open': lambda c: chest(c, True), 'chair': chair, 'table': table, 'bench': bench, 'crate': crate, 'barrel': barrel}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for name, fn in PIECES.items():
    if ONLY and name not in ONLY: continue
    rnd.seed(hash(name) % 1000); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 0.8 + cfg.get('d', 0) * 0.6; aim = H * 0.4
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel')
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
    print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
