"""The camp things of the starter island as set pieces (2026-10-20; art plan item 7, the fifth of Robin's order): the drying
rack, the woodpile, the chopping block, the log seat, the cart, the well, the trough, and the tents in plain wool (Robin: no
stripes). Built on the studio's construction as the benches were and rendered from the set pieces' camera: 35 degrees above the
ground, looking north, 4 px a game unit when packed, twice that here. One key colour, wood; the iron, the water and the fish as
the cool notes; the wool undyed.

  dryingRack     two A-frames and a pole at head height with split fish hanging                               1.7 m wide, 1.6 m tall
  woodpile       split logs stacked between two stakes, their cut ends toward the player                      1.3 m wide, 0.8 m tall
  choppingBlock  a stump knee high with the axe in it and a split log beside                                  0.5 m across
  logSeat        a log a metre long lying by the fire, its top planed flat                                    1.0 m long
  cart           a two-wheeled handcart resting on its shafts, a sack in the bed                              1.6 m long
  well           a ring of stones with two posts, a windlass and a bucket                                      1.2 m across, 1.4 m tall
  trough         a hollowed log on two feet with water in it                                                  1.1 m long
  vikingTent     the camp's A-frame tent: crossed end poles with carved heads, a ridge, undyed wool, open to the south   2.8 m long, 1.9 m tall
  tent           the small tent of the village, the same in plain wool                                        2.0 m long, 1.4 m tall

  node tools/blender.js camp_build.py -- <out dir> [--only well,cart]
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
rnd = random.Random(5)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'planedl': '#c9a874', 'bark': '#5e4332', 'iron': '#9aa1aa', 'irond': '#6f777f', 'rope': '#9a846a',
                 'cut': '#d9c28c', 'ring': '#b58e58', 'fish': '#e6dcc6', 'fishd': '#8d8f86', 'stone': '#66737a', 'stoned': '#56636a', 'water': '#5d7f8e', 'canvas': '#cbb892', 'canvasd': '#ab9772',
                 'dark': '#2b2522', 'sack': '#a89470', 'hay': '#c9b05e'}.items():
        C[k] = toon.material('c_' + k, v, None, 'cel')
def obj(name, coll, bm, m, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def box(name, coll, m, c, size, rz=0.0, rx=0.0, ry=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); R = Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ R @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(size) * 0.12, segments=1, affect='EDGES'); return obj(name, coll, bm, m)
def rod(S, p0, p1, r, m, r1=None): return S.chain([Vector(p0), Vector(p1)], (r, r1 if r1 is not None else r), None, m)
def arc(S, c, r, z, a0, a1, rr, m, n=8): S.chain([Vector((c[0] + math.cos(a0 + (a1 - a0) * i / n) * r, c[1] + math.sin(a0 + (a1 - a0) * i / n) * r, z)) for i in range(n + 1)], (rr, rr), None, m)
def disc(name, coll, m, c, r, normal, seg=16):
    q = Vector(normal).normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4(); bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=seg, radius=r)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ q, verts=bm.verts); return obj(name, coll, bm, m)
def cut_face(name, coll, c, r, normal):
    n = Vector(normal).normalized(); disc(name + '_face', coll, C['cut'], Vector(c) + n * 0.003, r * 0.98, n); disc(name + '_ring', coll, C['ring'], Vector(c) + n * 0.006, r * 0.55, n)
def stone(name, coll, m, c, size, n=12, rz=0.0):
    pts = []
    for i in range(n): th, ph = U(0, TAU), math.acos(U(-1, 1)); r = U(0.75, 1.0); pts.append(Vector((math.sin(ph) * math.cos(th) * r, math.sin(ph) * math.sin(th) * r, math.cos(ph) * r)))
    bm = bmesh.new()
    for p in pts: bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts[:]); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS'); bmesh.ops.dissolve_limit(bm, angle_limit=rad(14), verts=bm.verts[:], edges=bm.edges[:])
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts); return obj(name, coll, bm, m)
def aframe(S, x, h, spread, r, m, top=0.08):
    """two poles crossing just under their tops, as a drying rack's or a tent's end"""
    for sy in (-1, 1): rod(S, (x, sy * spread, 0.0), (x, -sy * top, h), r, m, r * 0.9)

# ---- the pieces ------------------------------------------------------------------------------------------------------
def drying_rack(coll):
    S = Stick(); L, H = 1.7, 1.55
    for x in (-L / 2, L / 2): aframe(S, x, H, 0.34, 0.03, 'wood')
    rod(S, (-L / 2 - 0.1, 0, H - 0.04), (L / 2 + 0.1, 0, H - 0.04), 0.028, 'woodd')                              # the pole
    S.build('frame', coll, C, subdiv=2)
    for i in range(6):                                                                                         # split fish hanging by the tail
        x = -L / 2 + 0.22 + i * (L - 0.44) / 5 + U(-0.03, 0.03); fl = U(0.42, 0.55)
        ball('fish%d' % i, coll, C['fish'], (x, -0.02, H - 0.08 - fl / 2), fl / 2, 0.32, 0.12, 1.0)
        ball('head%d' % i, coll, C['fishd'], (x, -0.03, H - 0.08 - fl + 0.05), 0.07, 1.0, 0.6, 0.9)
    return dict(h=H + 0.1, w=L + 0.8)
def woodpile(coll):
    S = Stick(); L, D = 1.2, 0.5; rows = [(4, 0.085), (3, 0.08), (3, 0.075), (2, 0.07)]; z = 0.0
    for sx in (-1, 1): rod(S, (sx * (L / 2 + 0.03), 0.0, 0), (sx * (L / 2 + 0.03), 0.0, 0.85), 0.03, 'woodd')     # the stakes
    S.build('stakes', coll, C, subdiv=2)
    for ri, (n, r) in enumerate(rows):                                                                          # split logs lying across, stacked
        z += r; S2 = Stick()
        for i in range(n):
            y = -(n - 1) / 2 * (D / n * 1.1) + i * (D / n * 1.1) + U(-0.01, 0.01); x0 = -L / 2 + U(0, 0.05); x1 = L / 2 - U(0, 0.05)
            rod(S2, (x0, y, z), (x1, y, z), r, 'bark' if (i + ri) % 2 else 'wood')
            for sx, xe in ((-1, x0), (1, x1)): cut_face('cut%d_%d_%d' % (ri, i, sx + 1), coll, (xe, y, z), r * 0.98, (sx, -0.35, 0.25))
        S2.build('row%d' % ri, coll, C, subdiv=2); z += r * 0.8
    return dict(h=z + 0.1, w=L + 0.7)
def chopping_block(coll):
    S = Stick(); R, H = 0.22, 0.5
    rod(S, (0, 0, 0), (0, 0, H), R, 'bark', R * 0.96); S.build('stump', coll, C, subdiv=2); cut_face('top', coll, (0, 0, H), R, (0, 0, 1))
    S2 = Stick(); rod(S2, (0.05, -0.05, H + 0.02), (0.36, -0.28, H + 0.62), 0.018, 'wood'); S2.build('haft', coll, C, subdiv=2)            # the axe in the block
    box('head', coll, C['iron'], (0.03, -0.03, H + 0.05), (0.13, 0.04, 0.1), rz=0.6, rx=rad(-20))
    S3 = Stick(); rod(S3, (-0.35, -0.3, 0.06), (-0.1, -0.5, 0.06), 0.06, 'wood'); S3.build('split', coll, C, subdiv=2)                       # a split log beside
    cut_face('splitcut', coll, (-0.1, -0.5, 0.06), 0.06, (0.6, -0.8, 0))
    return dict(h=H + 0.7, w=1.1)
def log_seat(coll):
    S = Stick(); L, R = 1.0, 0.17; rod(S, (-L / 2, 0, R), (L / 2, 0, R), R, 'bark'); S.build('log', coll, C, subdiv=2)
    box('seat', coll, C['planed'], (0, 0, R * 1.78), (L * 0.98, R * 1.2, 0.02))                                                           # the top planed flat
    for sx in (-1, 1): cut_face('end%d' % sx, coll, (sx * L / 2, 0, R), R, (sx, -0.3, 0.2))
    return dict(h=R * 2 + 0.1, w=L + 0.6)
def cart(coll):
    S = Stick(); L, W, Z = 1.2, 0.7, 0.42; tilt = rad(-10)
    bed = box('bed', coll, C['planed'], (0, 0, Z), (L, W, 0.04), ry=tilt)
    for sy in (-1, 1): box('side%d' % sy, coll, C['wood'], (0, sy * W / 2, Z + 0.12), (L, 0.03, 0.22), ry=tilt)
    box('back', coll, C['wood'], (L / 2, 0, Z + 0.12 - L / 2 * math.tan(-tilt)), (0.03, W, 0.22), ry=tilt)
    for sy in (-1, 1):                                                                                                                   # the wheels
        cy = sy * (W / 2 + 0.06); disc('wheel%d' % sy, coll, C['woodd'], (0.1, cy, 0.34), 0.34, (0, 1, 0), 20); disc('hub%d' % sy, coll, C['planed'], (0.1, cy + sy * 0.004, 0.34), 0.08, (0, 1, 0), 12)
        for k in range(6): a = TAU * k / 6; rod(S, (0.1, cy + sy * 0.006, 0.34), (0.1 + math.cos(a) * 0.3, cy + sy * 0.006, 0.34 + math.sin(a) * 0.3), 0.012, 'planed')
        arc(S, (0.1, cy + sy * 0.01), 0.33, 0.34, 0, TAU, 0.02, 'wood', 20)
    rod(S, (0.1, -W / 2 - 0.08, 0.34), (0.1, W / 2 + 0.08, 0.34), 0.03, 'woodd')                                                          # the axle
    for sy in (-1, 1): rod(S, (-L / 2, sy * W * 0.4, Z + L / 2 * math.tan(-tilt) * -1 - 0.0), (-L / 2 - 0.55, sy * W * 0.4, 0.08), 0.022, 'wood')   # the shafts, resting on the ground
    S.build('frame', coll, C, subdiv=2)
    ball('sack', coll, C['sack'], (0.15, 0.05, Z + 0.18), 0.2, 1.2, 1.0, 0.75)                                                             # a sack in the bed
    return dict(h=0.9, w=L + 1.2)
def well(coll):
    R, H = 0.5, 0.55
    loft('drum', coll, C['stoned'], [((0, 0, 0.0), R, R * 0.9), ((0, 0, H), R * 1.02, R * 0.92)], seg=20)                                 # the well head
    for row in range(3):                                                                                                                    # the laid stones, three courses staggered
        n = 11; z = 0.09 + row * 0.18
        for i in range(n): a = TAU * (i + row * 0.5) / n; box('st%d_%d' % (row, i), coll, C['stone'], (math.cos(a) * R * 1.02, math.sin(a) * R * 0.92, z), (0.1, 0.24 * U(0.8, 1.0), 0.13), rz=a)
    disc('rim', coll, C['stone'], (0, 0, H + 0.01), R * 1.04, (0, 0, 1), 20); disc('hole', coll, C['dark'], (0, 0, H + 0.015), R * 0.72, (0, 0, 1), 20)
    S = Stick()
    for sx in (-1, 1): rod(S, (sx * (R + 0.05), 0.05, 0.1), (sx * (R + 0.02), 0.05, 1.3), 0.04, 'wood')                                    # the posts
    rod(S, (-R - 0.05, 0.05, 1.3), (R + 0.05, 0.05, 1.3), 0.035, 'woodd')                                                                   # the beam
    rod(S, (-R * 0.9, 0.05, 1.1), (R * 0.9, 0.05, 1.1), 0.06, 'planed')                                                                      # the windlass roller
    rod(S, (R + 0.02, 0.05, 1.1), (R + 0.22, 0.05, 1.1), 0.02, 'wood'); rod(S, (R + 0.22, 0.05, 1.1), (R + 0.22, 0.05, 0.9), 0.018, 'wood')   # the crank
    rod(S, (0, 0.0, 1.1), (0, 0.0, 0.78), 0.008, 'rope')
    S.build('frame', coll, C, subdiv=2)
    loft('bucket', coll, C['wood'], [((0, 0, 0.62), 0.09, 0.09), ((0, 0, 0.8), 0.11, 0.11)], seg=12)                                        # the bucket on the rope
    return dict(h=1.42, w=R * 2 + 1.0)
def trough(coll):
    L, W, H = 1.1, 0.36, 0.3
    loft('body', coll, C['wood'], [((0, 0, 0.1), L / 2, W / 2 * 0.9), ((0, 0, H), L / 2 * 1.02, W / 2)], seg=16)
    disc('water', coll, C['water'], (0, 0, H - 0.05), 0.47, (0, 0, 1), 16);
    bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=16, radius=1.0); bmesh.ops.transform(bm, matrix=Matrix.Translation((0, 0, H - 0.05)) @ Matrix.Diagonal((L / 2 * 0.9, W / 2 * 0.78, 1, 1)), verts=bm.verts); obj('water', coll, bm, C['water'])
    bpy.data.objects.remove(bpy.data.objects['water'])
    S = Stick()
    for sx in (-1, 1): rod(S, (sx * L * 0.32, -0.12, 0), (sx * L * 0.32, 0.12, 0), 0.06, 'woodd')                                           # the feet
    S.build('feet', coll, C, subdiv=2)
    return dict(h=H + 0.1, w=L + 0.6)
def viking_tent(coll, L=2.8, W=2.2, H=1.9, pole=0.04, name='vikingTent'):
    S = Stick(); half = L / 2
    for sy in (-1, 1):                                                                                                                     # the crossed end poles, front and back
        for sx in (-1, 1): rod(S, (sx * W / 2, sy * half, 0), (-sx * 0.14, sy * half, H + 0.22), pole, 'woodd', pole * 0.9)
        for sx in (-1, 1): ball('%s_head%d%d' % (name, sx, sy), coll, C['woodd'], (-sx * 0.17, sy * half, H + 0.26), pole * 1.8, 1.6, 1.0, 1.2)   # the carved heads
    rod(S, (0, -half - 0.15, H), (0, half + 0.15, H), pole * 0.9, 'woodd')                                                                 # the ridge
    S.build('poles', coll, C, subdiv=2)
    for sx in (-1, 1):                                                                                                                     # the two slopes of wool: the west one lit, the east in shade
        bm = bmesh.new(); a, b = Vector((sx * W / 2, -half, 0.02)), Vector((sx * W / 2, half, 0.02)); c, d = Vector((0, half, H - 0.01)), Vector((0, -half, H - 0.01))
        v = [bm.verts.new(p) for p in (a, b, c, d)]; bm.faces.new(v); o = obj('%s_slope%d' % (name, sx), coll, bm, C['canvas' if sx < 0 else 'canvasd']); so = o.modifiers.new('Solid', 'SOLIDIFY'); so.thickness = 0.03
    bm = bmesh.new(); v = [bm.verts.new(p) for p in (Vector((-W / 2 + 0.05, half - 0.02, 0.02)), Vector((W / 2 - 0.05, half - 0.02, 0.02)), Vector((0, half - 0.02, H - 0.05)))]; bm.faces.new(v); obj('%s_back' % name, coll, bm, C['canvasd'])   # the back end closed
    bm = bmesh.new(); v = [bm.verts.new(p) for p in (Vector((-W / 2 + 0.25, -half + 0.35, 0.03)), Vector((W / 2 - 0.25, -half + 0.35, 0.03)), Vector((0, -half + 0.35, H * 0.78)))]; bm.faces.new(v); obj('%s_inside' % name, coll, bm, C['dark'])   # the dark inside, seen through the open mouth
    return dict(h=H + 0.35, w=W + 0.8, d=L)
def tent(coll): return viking_tent(coll, L=2.0, W=1.7, H=1.4, pole=0.03, name='tent')

PIECES = {'dryingRack': drying_rack, 'woodpile': woodpile, 'choppingBlock': chopping_block, 'logSeat': log_seat, 'cart': cart, 'well': well, 'trough': trough, 'vikingTent': viking_tent, 'tent': tent}
CREASE = {'well': 118}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for name, fn in PIECES.items():
    if ONLY and name not in ONLY: continue
    rnd.seed(hash(name) % 1000); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 1.0 + cfg.get('d', 0) * 0.6; aim = H * 0.4
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(CREASE.get(name, 100))
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
    print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
