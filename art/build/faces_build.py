"""The buildings' faces as set pieces (2026-10-20; villages plan step 3): what stands against or on a drawn wall and was still the
old drawn prop. The walls, roofs and doors stay the kit's (a wall in the kit is drawn a storey and a half, 32 units, 1.5 m, so
these are sized to it, not to a man). Rendered from the set pieces' camera: 35 degrees above the ground, looking north, 4 px a
game unit when packed, twice that here.

  porch        a small gabled porch over a door: two posts, a plank roof with crossed boards, open to the south         1.4 m wide, 1.7 m tall
  bellTower    the church's tower beside its nave: a square timber tower on a stone footing, a bell under a hood roof   1.5 m square, 4.4 m tall
  apse         the church's rounded east end: a half drum of cut stone under a half cone of slate                      1.6 m across, 1.9 m tall
  gableCross   a wooden cross on the gable's peak                                                                      0.5 m across, 1.0 m tall
  lantern      a horn lantern on an iron bracket by a door (the game lights it at night)                                0.5 m out, at 1.3 m
  sign         a hanging sign on a bracket: a plank with a carved beast, two chains                                    0.6 m wide, hangs at 1.4 m
  awning       a plain wool awning on two poles over an open front (no stripes)                                        2.0 m wide, 1.7 m tall
  woodshed     a lean-to against a wall with split wood stacked under it and the chopping block before it               2.2 m wide, 1.6 m tall
  foodTable    the hall's table laid: a cloth, bread, a joint, a jug, bowls, two benches                               1.8 m long

  node tools/blender.js faces_build.py -- <out dir> [--only porch,sign]
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
rnd = random.Random(17)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'planedl': '#c9a874', 'bark': '#5e4332', 'iron': '#6f777f', 'irond': '#4a5058', 'bronze': '#9a7a3e', 'horn': '#e8d8a8', 'flame': '#ffb24a',
                 'stone': '#a9a39a', 'stoned': '#8a847a', 'slate': '#5a6470', 'slated': '#46505a', 'shingle': '#6a5240', 'canvas': '#cbb892', 'canvasd': '#ab9772', 'cloth': '#e2d8c2', 'bread': '#b8864a', 'meat': '#8a4a3a', 'clay': '#9a7352', 'cut': '#d9c28c', 'ring': '#b58e58', 'dark': '#2b2522', 'bell': '#8a7a4a'}.items():
        C[k] = toon.material('v_' + k, v, None, 'cel')
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
def gable_roof(name, coll, m, cx, y0, y1, w, h0, rise, thick=0.04, boards=True, ridge='woodd'):
    """a pitched roof with the ridge along y, from y0 (south) to y1 (north): two slopes, crossed boards at the south end"""
    quad(name + '_w', coll, m, [(cx - w / 2, y0, h0), (cx - w / 2, y1, h0), (cx, y1, h0 + rise), (cx, y0, h0 + rise)], thick)
    quad(name + '_e', coll, C[ridge] if m is C['canvas'] else m, [(cx, y0, h0 + rise), (cx, y1, h0 + rise), (cx + w / 2, y1, h0), (cx + w / 2, y0, h0)], thick)
    S = Stick(); rod(S, (cx, y0 - 0.06, h0 + rise + 0.02), (cx, y1 + 0.06, h0 + rise + 0.02), 0.03, ridge)
    if boards:
        for sy in (y0 - 0.04, y1 + 0.04):
            rod(S, (cx - 0.14, sy, h0 + rise - 0.12), (cx + 0.14, sy, h0 + rise + 0.22), 0.02, ridge); rod(S, (cx + 0.14, sy, h0 + rise - 0.12), (cx - 0.14, sy, h0 + rise + 0.22), 0.02, ridge)
    S.build(name + '_ridge', coll, C, subdiv=2)

# ---- the pieces ------------------------------------------------------------------------------------------------------
def porch(coll):
    W, D, H = 1.4, 0.9, 1.5; S = Stick()
    for sx in (-1, 1): rod(S, (sx * W / 2, -D, 0), (sx * W / 2, -D, H), 0.05, 'wood')                                                   # the two posts, the wall end is the house
    for sx in (-1, 1): rod(S, (sx * W / 2, -D, H), (sx * W / 2, 0.02, H + 0.02), 0.04, 'woodd')                                           # the plates back to the wall
    S.build('posts', coll, C, subdiv=2)
    gable_roof('roof', coll, C['planed'], 0, -D - 0.15, 0.05, W + 0.3, H, 0.5)
    box('step', coll, C['stoned'], (0, -D * 0.5, 0.04), (W * 0.7, D * 0.8, 0.08))                                                         # a flagstone step under it
    return dict(h=H + 0.6, w=W + 0.6, d=D + 0.2)
def bell_tower(coll):
    W, H = 1.5, 3.2
    box('footing', coll, C['stone'], (0, 0, 0.35), (W + 0.1, W + 0.1, 0.7), bevel=0.05)
    for k in range(3): box('course%d' % k, coll, C['stoned'], (-W / 2 - 0.02 + U(0, 0.05), -W / 2 - 0.06, 0.12 + k * 0.22), (U(0.3, 0.5), 0.04, 0.16), bevel=0.0)      # the footing's courses on the south face
    S = Stick()
    for sx in (-1, 1):
        for sy in (-1, 1): rod(S, (sx * W * 0.42, sy * W * 0.42, 0.7), (sx * W * 0.36, sy * W * 0.36, H), 0.07, 'woodd')                   # four posts leaning in
    for z in (1.4, 2.2):
        for sx in (-1, 1): rod(S, (sx * W * 0.4, -W * 0.4, z), (sx * W * 0.4, W * 0.4, z), 0.04, 'wood')
        for sy in (-1, 1): rod(S, (-W * 0.4, sy * W * 0.4, z), (W * 0.4, sy * W * 0.4, z), 0.04, 'wood')
    rod(S, (-W * 0.4, -W * 0.41, 0.75), (W * 0.36, -W * 0.41, 2.15), 0.035, 'wood'); rod(S, (W * 0.4, -W * 0.41, 0.75), (-W * 0.36, -W * 0.41, 2.15), 0.035, 'wood')   # the cross braces on the south face
    S.build('frame', coll, C, subdiv=2)
    for sx in (-1, 1): quad('side%d' % sx, coll, C['planed'], [(sx * W * 0.41, -W * 0.41, 0.72), (sx * W * 0.41, W * 0.41, 0.72), (sx * W * 0.36, W * 0.36, 2.2), (sx * W * 0.36, -W * 0.36, 2.2)], 0.03)   # the boarded sides (east and west)
    quad('back', coll, C['planed'], [(-W * 0.41, W * 0.41, 0.72), (W * 0.41, W * 0.41, 0.72), (W * 0.36, W * 0.36, 2.2), (-W * 0.36, W * 0.36, 2.2)], 0.03)
    ball('bell', coll, C['bell'], (0, 0, 2.6), 0.2, 1.0, 1.0, 1.15); box('yoke', coll, C['woodd'], (0, 0, 2.85), (0.5, 0.08, 0.08))
    H2 = H + 0.05; rise = 0.7
    for (a, b, cc, d) in (((-W * 0.5, -W * 0.5), (W * 0.5, -W * 0.5), (0, 0), None), ((W * 0.5, -W * 0.5), (W * 0.5, W * 0.5), (0, 0), None), ((W * 0.5, W * 0.5), (-W * 0.5, W * 0.5), (0, 0), None), ((-W * 0.5, W * 0.5), (-W * 0.5, -W * 0.5), (0, 0), None)):
        bm = bmesh.new(); vs = [bm.verts.new(Vector((a[0], a[1], H2))), bm.verts.new(Vector((b[0], b[1], H2))), bm.verts.new(Vector((0, 0, H2 + rise)))]; bm.faces.new(vs); o = obj('hood%d%d' % (int(a[0] > 0), int(a[1] > 0)), coll, bm, C['slate'] if a[1] < 0 or a[0] < 0 else C['slated']); o.modifiers.new('Solid', 'SOLIDIFY').thickness = 0.04
    ball('knob', coll, C['woodd'], (0, 0, H2 + rise + 0.06), 0.06)
    return dict(h=H2 + rise + 0.2, w=W + 0.8, d=W)
def apse(coll):
    R, H = 0.8, 1.5
    loft('drum', coll, C['stone'], [((0, 0, 0.0), R, R * 0.9), ((0, 0, H), R, R * 0.9)], seg=20, arc=(0, math.pi), closed=False)                                            # the half drum, open to the north where the nave is
    for row in range(5):
        for i in range(6): a = math.pi * (i + 0.5 + (row % 2) * 0.5) / 6.5; box('st%d_%d' % (row, i), coll, C['stoned'], (math.cos(a) * R * 1.01, math.sin(a) * R * 0.91, 0.15 + row * 0.28), (0.04, U(0.22, 0.3), 0.2), rz=a, bevel=0.0)   # the courses' joints
    loft('roof', coll, C['slate'], [((0, 0, H), R * 1.12, R * 1.0), ((0, 0, H + 0.55), R * 0.1, R * 0.1)], seg=20, arc=(0, math.pi), closed=False)                           # the half cone of slate
    box('window', coll, C['dark'], (0, -R * 0.9, H * 0.6), (0.14, 0.06, 0.3), bevel=0.0)                                                                                  # one slit window to the south
    return dict(h=H + 0.7, w=R * 2 + 0.6, d=R)
def gable_cross(coll):
    S = Stick(); rod(S, (0, 0, 0), (0, 0, 1.0), 0.035, 'woodd'); rod(S, (-0.25, 0, 0.72), (0.25, 0, 0.72), 0.03, 'woodd'); S.build('cross', coll, C, subdiv=2)
    return dict(h=1.1, w=0.9, d=0.3)
def lantern(coll):
    S = Stick(); rod(S, (0, 0, 1.3), (0.45, -0.02, 1.3), 0.02, 'iron'); rod(S, (0.02, 0, 1.05), (0.3, -0.01, 1.28), 0.015, 'iron'); S.build('bracket', coll, C, subdiv=2)   # the bracket from the wall (the wall is at y 0, north)
    rod2 = Stick(); rod2.chain([Vector((0.44, -0.02, 1.29)), Vector((0.44, -0.02, 1.2))], (0.008, 0.008), None, 'irond'); rod2.build('hook', coll, C, subdiv=1)
    box('body', coll, C['horn'], (0.44, -0.02, 1.02), (0.18, 0.18, 0.3), bevel=0.08); box('cap', coll, C['irond'], (0.44, -0.02, 1.2), (0.24, 0.24, 0.05))
    for k in range(4): a = TAU * k / 4 + 0.78; box('rib%d' % k, coll, C['irond'], (0.44 + math.cos(a) * 0.095, -0.02 + math.sin(a) * 0.095, 1.02), (0.02, 0.02, 0.3), bevel=0.0)
    ball('flame', coll, C['flame'], (0.44, -0.02, 1.0), 0.05, 1.0, 1.0, 1.3)
    return dict(h=1.5, w=1.1, d=0.5)
def sign(coll):
    S = Stick(); rod(S, (0, 0, 1.55), (0.55, -0.02, 1.55), 0.022, 'iron'); rod(S, (0.02, 0, 1.3), (0.4, -0.01, 1.53), 0.016, 'iron')
    for x in (0.18, 0.5): rod(S, (x, -0.02, 1.54), (x, -0.02, 1.36), 0.006, 'irond')                                                                               # the two chains
    S.build('bracket', coll, C, subdiv=2)
    box('board', coll, C['planed'], (0.34, -0.02, 1.16), (0.56, 0.03, 0.4), bevel=0.06)
    S2 = Stick(); S2.chain([Vector((0.14, -0.045, 1.08)), Vector((0.26, -0.045, 1.2)), Vector((0.4, -0.045, 1.14)), Vector((0.52, -0.045, 1.24))], [(0.018, 0.018)] * 4, None, 'woodd'); S2.build('beast', coll, C, subdiv=1)   # the carved beast, a bare line
    ball('head', coll, C['woodd'], (0.54, -0.05, 1.26), 0.035)
    return dict(h=1.7, w=1.2, d=0.4)
def awning(coll):
    W, D, H = 2.0, 1.3, 1.6; S = Stick()
    for sx in (-1, 1): rod(S, (sx * W / 2, -D, 0), (sx * W / 2, -D, H - 0.35), 0.04, 'wood')
    rod(S, (-W / 2 - 0.1, -D, H - 0.35), (W / 2 + 0.1, -D, H - 0.35), 0.03, 'woodd'); S.build('poles', coll, C, subdiv=2)
    quad('cloth', coll, C['canvas'], [(-W / 2 - 0.05, -D - 0.05, H - 0.34), (W / 2 + 0.05, -D - 0.05, H - 0.34), (W / 2 + 0.05, 0.02, H + 0.02), (-W / 2 - 0.05, 0.02, H + 0.02)], 0.03)
    for k in range(6): x = -W / 2 + W * (k + 0.5) / 6; box('hem%d' % k, coll, C['canvasd'], (x, -D - 0.06, H - 0.42), (W / 6 - 0.03, 0.03, 0.12), rz=U(-0.05, 0.05), bevel=0.0)         # the ragged hem
    return dict(h=H + 0.2, w=W + 0.6, d=D + 0.2)
def woodshed(coll):
    W, D, H = 2.2, 1.0, 1.5; S = Stick()
    for sx in (-1, 1): rod(S, (sx * W / 2, -D, 0), (sx * W / 2, -D, H - 0.4), 0.05, 'wood')
    rod(S, (-W / 2 - 0.1, -D, H - 0.4), (W / 2 + 0.1, -D, H - 0.4), 0.04, 'woodd'); S.build('posts', coll, C, subdiv=2)
    quad('roof', coll, C['planed'], [(-W / 2 - 0.12, -D - 0.12, H - 0.38), (W / 2 + 0.12, -D - 0.12, H - 0.38), (W / 2 + 0.12, 0.02, H + 0.05), (-W / 2 - 0.12, 0.02, H + 0.05)], 0.05)
    S2 = Stick(); z = 0.0; rows = [(6, 0.085), (5, 0.08), (4, 0.075), (3, 0.07)]
    for ri, (n, r) in enumerate(rows):                                                                                                        # split wood stacked under it, cut ends to the player
        z += r
        for i in range(n): x = -(n - 1) / 2 * (W * 0.8 / n) + i * (W * 0.8 / n) + U(-0.01, 0.01); y0 = -D * 0.85 + U(-0.02, 0.02); rod(S2, (x, y0, z), (x, y0 + D * 0.7, z), r, 'bark' if (i + ri) % 2 else 'wood'); cut_face('cut%d_%d' % (ri, i), coll, (x, y0, z), r * 0.98, (0, -1, 0.1))
        z += r * 0.8
    S2.build('wood', coll, C, subdiv=2)
    S3 = Stick(); rod(S3, (W / 2 + 0.45, -D - 0.3, 0), (W / 2 + 0.45, -D - 0.3, 0.45), 0.2, 'bark', 0.19); S3.build('block', coll, C, subdiv=2); cut_face('blocktop', coll, (W / 2 + 0.45, -D - 0.3, 0.45), 0.2, (0, 0, 1))   # the chopping block
    S4 = Stick(); rod(S4, (W / 2 + 0.5, -D - 0.35, 0.47), (W / 2 + 0.8, -D - 0.55, 1.05), 0.018, 'wood'); S4.build('haft', coll, C, subdiv=2); box('axe', coll, C['iron'], (W / 2 + 0.48, -D - 0.33, 0.5), (0.12, 0.04, 0.09), rz=0.6, rx=rad(-20))
    return dict(h=H + 0.2, w=W + 1.4, d=D + 0.6)
def food_table(coll):
    L, W, H = 1.8, 0.7, 0.75; S = Stick()
    for x in (-0.65, 0.65):
        for sy in (-1, 1): rod(S, (x + (0.06 if x > 0 else -0.06), sy * 0.3, 0), (x, sy * 0.08, H - 0.05), 0.035, 'wood', 0.03)
    for x in (-0.65, 0.65): rod(S, (x, 0.0, 0.22), (x, 0.0, 0.22), 0.03, 'woodd')
    for sy in (-1, 1):                                                                                                                       # two benches
        for x in (-0.6, 0.6):
            for s2 in (-1, 1): rod(S, (x, sy * 0.62 + s2 * 0.1, 0), (x, sy * 0.62 + s2 * 0.05, 0.42), 0.03, 'wood')
    S.build('frame', coll, C, subdiv=2)
    box('top', coll, C['planed'], (0, 0, H - 0.025), (L, W, 0.05)); box('cloth', coll, C['cloth'], (0, 0, H + 0.005), (L * 0.55, W * 1.08, 0.012), bevel=0.0)
    for sy in (-1, 1): box('bench%d' % sy, coll, C['planed'], (0, sy * 0.62, 0.42), (L * 0.85, 0.26, 0.04))
    for k in range(3): ball('bread%d' % k, coll, C['bread'], (-0.5 + k * 0.2, -0.12 + 0.05 * k, H + 0.05), 0.07, 1.3, 1.0, 0.6)
    ball('joint', coll, C['meat'], (0.3, 0.1, H + 0.06), 0.14, 1.5, 1.0, 0.6); box('bone', coll, C['cloth'], (0.5, 0.1, H + 0.07), (0.18, 0.03, 0.03), rz=0.2, bevel=0.0)
    loft('jug', coll, C['clay'], [((0.65, -0.15, H), 0.06, 0.06), ((0.65, -0.15, H + 0.12), 0.09, 0.09), ((0.65, -0.15, H + 0.24), 0.045, 0.045), ((0.65, -0.15, H + 0.28), 0.055, 0.055)], seg=12)
    for k in range(4): loft('bowl%d' % k, coll, C['clay'], [((-0.7 + k * 0.45, 0.22 if k % 2 else -0.24, H), 0.05, 0.05), ((-0.7 + k * 0.45, 0.22 if k % 2 else -0.24, H + 0.05), 0.09, 0.09)], seg=12)
    return dict(h=H + 0.4, w=L + 0.6, d=W + 1.4)

PIECES = {'porch': porch, 'bellTower': bell_tower, 'apse': apse, 'gableCross': gable_cross, 'lantern': lantern, 'sign': sign, 'awning': awning, 'woodshed': woodshed, 'foodTable': food_table}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for name, fn in PIECES.items():
    if ONLY and name not in ONLY: continue
    rnd.seed(sum(ord(ch) for ch in name)); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 0.8 + cfg.get('d', 0) * 0.6; aim = H * 0.38
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel')
    toon.piece_line(fs)
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
    print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
