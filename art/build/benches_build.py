"""The chapter's crafting stations as set pieces (2026-10-20; art plan item 5, Robin's order: the workbench and the shipwright's
bench, the raft bench, first). Built on the studio's construction and rendered from the set pieces' camera as the fires and the
trees were (35 degrees above the ground, looking north, 4 px a game unit when packed, twice that here), in the trees' hand: the
cel light, the hero's line, one key colour with the iron as the cool note.

  workbench     a joiner's bench, about as long as the hero is tall: a thick planed slab on two splayed trestles with a stretcher;
                on it an adze, a mallet standing head up, two chisels and a half-shaped plank; a plank leaning on the near leg;
                its long side faces the player (south): he stands before it to work.
  shipwright1   the raft bench, on the sand by the water: two low trestles carrying the first log across, its cut end showing, an
                adze stuck in it; a second log on the ground behind, a coil of rope and a bundle of fibre lashings before it.

  node tools/blender.js benches_build.py -- <out dir> [--only workbench,shipwright1]
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
    for k, v in {'wood': '#6b4a36', 'woodd': '#55392a', 'planed': '#b08a5a', 'planedl': '#c9a874', 'bark': '#5e4332', 'iron': '#9aa1aa', 'irond': '#6f777f', 'rope': '#9a846a', 'fibre': '#b7a070', 'cut': '#d9c28c', 'ring': '#b58e58'}.items():
        C[k] = toon.material('p_' + k, v, None, 'cel')
def obj(name, coll, bm, m, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def box(name, coll, m, c, size, rz=0.0, rx=0.0, ry=0.0):
    """a block, its edges rounded a hair so the ink reads them as one plank and not a wireframe"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); R = Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ R @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(size) * 0.12, segments=1, affect='EDGES'); return obj(name, coll, bm, m)
def rod(S, p0, p1, r, m, r1=None): return S.chain([Vector(p0), Vector(p1)], (r, r1 if r1 is not None else r), None, m)
def arc(S, c, r, z, a0, a1, rr, m, n=8): S.chain([Vector((c[0] + math.cos(a0 + (a1 - a0) * i / n) * r, c[1] + math.sin(a0 + (a1 - a0) * i / n) * r, z)) for i in range(n + 1)], (rr, rr), None, m)
def cut_disc(name, coll, c, r, axis):
    ax = (Vector(axis).normalized() + Vector((0, -0.9, 0.5))).normalized(); q = ax.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    for nm, rr, mk, dz in (('_face', r * 0.98, 'cut', 0.0), ('_ring', r * 0.55, 'ring', 0.004)):
        bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=16, radius=rr); bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ q @ Matrix.Translation((0, 0, dz)), verts=bm.verts); obj(name + nm, coll, bm, C[mk])
def trestle(S, x, h, spread, r, m, top_w=0.0):
    """two legs splayed front and back (and a little out), a cross piece half way up"""
    out = 0.09 if x > 0 else -0.09
    for sy in (-1, 1): rod(S, (x + out, sy * spread, 0.0), (x, sy * top_w, h), r, m, r * 0.9)
    rod(S, (x + out * 0.5, -spread * 0.55, h * 0.45), (x + out * 0.5, spread * 0.55, h * 0.45), r * 0.8, m)

def workbench(coll):
    S = Stick(); L, W, T, H = 1.6, 0.46, 0.11, 0.78
    for x in (-0.55, 0.55): trestle(S, x, H - T, 0.24, 0.046, 'wood', 0.07)
    rod(S, (-0.58, 0, 0.32), (0.58, 0, 0.32), 0.034, 'woodd')                                             # the stretcher
    rod(S, (-0.52, -0.1, H + 0.03), (-0.18, -0.04, H + 0.03), 0.016, 'wood'); rod(S, (0.16, 0.06, H + 0.0), (0.16, 0.06, H + 0.2), 0.016, 'wood')   # the adze's haft lying, the mallet's standing
    rod(S, (0.32, -0.12, H + 0.02), (0.5, -0.14, H + 0.02), 0.011, 'wood'); rod(S, (0.36, -0.07, H + 0.02), (0.54, -0.1, H + 0.02), 0.011, 'wood')   # the chisels' handles
    rod(S, (0.5, -0.14, H + 0.02), (0.62, -0.155, H + 0.02), 0.006, 'iron'); rod(S, (0.54, -0.1, H + 0.02), (0.66, -0.12, H + 0.02), 0.006, 'iron')
    S.build('frame', coll, C, subdiv=2)
    box('slab', coll, C['planed'], (0, 0, H + 0.005 - T / 2 + T / 2 * 0), (L, W, T))                             # the slab: its top at H
    box('slabend', coll, C['planedl'], (L / 2 + 0.004, 0, H - T / 2), (0.01, W * 0.96, T * 0.9))                 # the end grain, a touch paler
    box('adze', coll, C['iron'], (-0.14, -0.03, H + 0.045), (0.11, 0.04, 0.02), rz=0.15, rx=rad(20))              # the adze's blade
    box('mallet', coll, C['woodd'], (0.16, 0.06, H + 0.22), (0.19, 0.1, 0.07), rz=0.1)                            # the mallet's head
    box('plank_on', coll, C['planedl'], (0.15, 0.14, H + 0.02), (0.9, 0.13, 0.03), rz=0.04)                     # a half-shaped plank at the back
    box('plank_lean', coll, C['planed'], (0.72, -0.17, 0.4), (0.12, 0.03, 0.86), rx=rad(-12), ry=rad(8))         # a plank leaning on the near leg
    return dict(h=1.05, w=2.4)

def shipwright1(coll):
    S = Stick(); H = 0.48
    for x in (-0.6, 0.6): trestle(S, x, H, 0.28, 0.046, 'wood', 0.08)
    S.chain([Vector((-1.1 + 2.2 * i / 6, 0.02 * math.sin(i * 1.3), H + 0.13 + 0.01 * math.cos(i))) for i in range(7)], [(0.14, 0.13)] * 4 + [(0.13, 0.12)] * 3, None, 'bark')   # the first log across
    S.chain([Vector((0.45 + 1.3 * i / 5, 0.42 - 0.12 * i / 5 + 0.02 * math.cos(i), 0.11)) for i in range(6)], [(0.11, 0.1)] * 6, None, 'bark')                                  # a second log on the ground, past the right end
    rod(S, (0.1, -0.02, H + 0.25), (-0.22, -0.14, H + 0.62), 0.016, 'wood')                                                                                                     # the adze's haft, stuck in the log
    for k in range(3): arc(S, (-0.98, -0.36), 0.11 - k * 0.012, 0.03 + k * 0.045, 0, TAU, 0.022, 'rope', 14)                                                                  # a coil of rope
    for k in range(4): a = U(-0.35, 0.35); rod(S, (0.72 + U(-0.04, 0.04), -0.4, 0.02 + k * 0.01), (0.72 + 0.5 * math.cos(a), -0.4 + 0.5 * math.sin(a), 0.025 + k * 0.012), 0.022, 'fibre')   # fibre lashings in a loose bundle
    S.build('frame', coll, C, subdiv=2)
    cut_disc('cut', coll, (1.12, 0.0, H + 0.13), 0.12, (1, 0, 0))
    box('adze', coll, C['iron'], (0.13, -0.03, H + 0.25), (0.15, 0.06, 0.025), rz=0.3, rx=rad(35))
    box('peg', coll, C['planed'], (-0.3, -0.42, 0.02), (0.3, 0.04, 0.04), rz=0.5); box('peg2', coll, C['planed'], (-0.1, -0.5, 0.06), (0.26, 0.04, 0.04), rz=-0.2)   # pegs for the raft, cut and waiting
    return dict(h=1.15, w=3.6)

PIECES = {'workbench': workbench, 'shipwright1': shipwright1}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for name, fn in PIECES.items():
    if ONLY and name not in ONLY: continue
    rnd.seed(hash(name) % 1000); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 1.0; aim = H * 0.4
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel')
    toon.piece_line(fs)
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': H}
    print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
