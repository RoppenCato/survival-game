"""The ring's stakes and the rail fence's posts as set pieces (2026-10-20; villages plan step 2). The round rings of a village are
props, a stake a tile, laid on the generator's polygon (the developer, 2026-10-20), so each stake is its own picture and the
ring can wander: stakes of uneven height that lean, each its own bark, one in ten pale new wood where the ring was mended, a
hacked stump where it was broken. The rail fence's posts likewise; the rails between them the game draws. Wattle hurdles are
rigid panels, so they come a tile wide for runs along x and along y. Rendered from the set pieces' camera: 35 degrees above
the ground, looking north, 4 px a game unit when packed, twice that here.

  stake_1..6     a split stake 1.4 to 1.7 m tall, sharpened, bark on, leaning up to 6 degrees, its own tone; _3 and _6 with a rotted flat top
  stake_new      a mended stake: pale new wood, straight, sharp
  stake_stump    a stake hacked down: a stump a knee high with the split pale, splinters at its foot
  railPost_1..3  a fence post a hip high, split, leaning a little, a tuft at its foot
  hurdle_1..3    a wattle hurdle a tile wide between two posts, running along x (east to west), its top ragged
  hurdleV_1..3   the same running along y (north to south)

  node tools/blender.js fences_build.py -- <out dir> [--only stake_1,hurdle_2]
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
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2; rad = math.radians; TAU = 2 * math.pi; TILE = 32 / UNIT   # a tile in metres (1.48)
rnd = random.Random(13)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
def mats():
    for k, v in {'bark': '#5e4332', 'barkl': '#6e5540', 'barkd': '#4a3626', 'fresh': '#d7bf93', 'freshd': '#b89d6e', 'wood': '#6b4a36', 'woodd': '#55392a', 'withy': '#8a7452', 'wattle': '#a89474', 'wattled': '#7e6c4e', 'rot': '#2a2320', 'grass': '#6a9a44', 'grassl': '#86b450'}.items():
        C[k] = toon.material('f_' + k, v, None, 'cel')
def obj(name, coll, bm, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def blob(name, coll, m, spheres, voxel=0.03, tufts=0, tuft_r=0.3):
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
def split_timber(S, p0, p1, r, m, flat=True):
    """a split stake: a rod with a flat face toward the camera (the split), so the ink draws the split's edge"""
    S.chain([Vector(p0), Vector(p1)], (r, r * 0.92), None, m)
def tuft(coll, name, c, r=0.06):
    blob(name, coll, C['grass'], [((c[0], c[1], 0.02), r, (1.2, 1.0, 0.8)), ((c[0] + r * 0.7, c[1] - r * 0.3, 0.03), r * 0.7, (1, 1, 0.9))], tufts=5, tuft_r=0.35)

def stake(coll, v):
    """v 0..5 the ring's stakes; 6 the mended one; 7 the stump"""
    S = Stick(); H = (1.55, 1.68, 1.45, 1.62, 1.5, 1.7, 1.6, 0.55)[v]; lean = (0.05, -0.08, 0.1, -0.03, 0.07, -0.1, 0.0, 0.0)[v]; r = (0.11, 0.1, 0.12, 0.1, 0.11, 0.1, 0.1, 0.12)[v]
    m = 'fresh' if v == 6 else ('bark', 'barkl', 'barkd', 'bark', 'barkl', 'bark')[v % 6] if v < 6 else 'bark'
    top = Vector((lean * H, lean * 0.4 * H, H))
    S.chain([Vector((0, 0, -0.05)), Vector((lean * H * 0.5, lean * 0.2 * H, H * 0.5)), top], [(r, r), (r * 0.98, r * 0.95), (r * 0.9, r * 0.85)], None, m)
    S.build('stake', coll, C, subdiv=2)
    if v == 7:                                                                                                             # the stump: hacked through, the split pale, splinters
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r * 0.95, radius2=r * 0.3, depth=0.16); bmesh.ops.transform(bm, matrix=Matrix.Translation((0.02, -0.02, H + 0.06)) @ Matrix.Rotation(rad(25), 4, 'X'), verts=bm.verts); obj('split', coll, bm, C['fresh'], False)
        for k in range(4): a = U(0, TAU); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.transform(bm, matrix=Matrix.Translation((math.cos(a) * U(0.15, 0.3), math.sin(a) * U(0.1, 0.25), 0.015)) @ Matrix.Rotation(U(0, TAU), 4, 'Z') @ Matrix.Diagonal((U(0.12, 0.25), 0.03, 0.03, 1)), verts=bm.verts); obj('splinter%d' % k, coll, bm, C['freshd' if k % 2 else 'barkd'], False)
        return dict(h=H + 0.2, w=0.9, d=0.5)
    if v in (2, 5):                                                                                                         # the rotted flat top
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=r * 0.9, radius2=r * 0.75, depth=0.06); bmesh.ops.transform(bm, matrix=Matrix.Translation(top + Vector((0, 0, 0.02))), verts=bm.verts); obj('rot', coll, bm, C['rot'], False)
    else:                                                                                                                   # the sharpened point: four axe cuts, pale where the split is new
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=r * 0.98, radius2=0.0, depth=0.3); bmesh.ops.transform(bm, matrix=Matrix.Translation(top + Vector((0, 0, 0.14))) @ Matrix.Rotation(rad(45), 4, 'Z'), verts=bm.verts); obj('point', coll, bm, C['fresh' if v == 6 else 'freshd'], False)
    if v < 6:                                                                                                               # the withy where the rail is lashed, two thirds up
        W = Stick(); z = H * 0.66
        for k in range(3): W.chain([Vector((math.cos(k * 2.1) * r * 1.05 + lean * z, math.sin(k * 2.1) * r * 1.05 + lean * 0.4 * z, z + k * 0.025)), Vector((math.cos(k * 2.1 + 3.14) * r * 1.05 + lean * z, math.sin(k * 2.1 + 3.14) * r * 1.05 + lean * 0.4 * z, z + k * 0.025 + 0.012))], (0.014, 0.014), None, 'withy')
        W.build('withy', coll, C, subdiv=1)
    if v in (0, 3, 4): tuft(coll, 'tuft', (U(0.1, 0.2) * (1 if v != 3 else -1), -0.12), 0.06)
    return dict(h=H + 0.4, w=0.8, d=0.5)
def rail_post(coll, v):
    S = Stick(); H = (0.95, 1.05, 0.9)[v]; lean = (0.03, -0.06, 0.05)[v]; r = 0.07
    S.chain([Vector((0, 0, -0.05)), Vector((lean * H, lean * 0.3 * H, H))], (r, r * 0.9), None, ('wood', 'barkl', 'woodd')[v]); S.build('post', coll, C, subdiv=2)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=r * 0.95, radius2=r * 0.5, depth=0.08); bmesh.ops.transform(bm, matrix=Matrix.Translation((lean * H, lean * 0.3 * H, H + 0.03)) @ Matrix.Rotation(rad(12), 4, 'Y'), verts=bm.verts); obj('top', coll, bm, C['freshd'], False)
    if v != 1: tuft(coll, 'tuft', (0.12 if v == 0 else -0.14, -0.1), 0.055)
    return dict(h=H + 0.2, w=0.7, d=0.4)
def hurdle(coll, v, along_y=False):
    """a wattle hurdle a tile wide: two posts and the weave between, its top ragged; along_y turns it to run north to south"""
    L = TILE; H = (0.95, 1.0, 0.9)[v]; S = Stick(); R = Matrix.Rotation(rad(90), 4, 'Z') if along_y else Matrix.Identity(4)
    def P(x, y, z): v4 = R @ Vector((x, y, z, 1.0)); return Vector((v4.x, v4.y, v4.z))
    for sx in (-1, 1): S.chain([P(sx * L / 2, 0, -0.05), P(sx * L / 2 + U(-0.02, 0.02), U(-0.02, 0.02), H + 0.08)], (0.045, 0.04), None, 'woodd')
    for k in range(5): x = -L / 2 + L * (k + 0.5) / 5; S.chain([P(x, 0, 0), P(x + U(-0.01, 0.01), 0, H - 0.04 + U(-0.04, 0.04))], (0.022, 0.02), None, 'wood')               # the sails (the uprights)
    for j in range(9):                                                                                                                                                          # the withies woven between
        z = 0.08 + j * (H - 0.14) / 8; pts = [P(-L / 2 + L * i / 10, 0.03 * math.sin(i * math.pi + j * math.pi) * (1 if i % 2 else -1) * 0.6, z + 0.01 * math.sin(i * 1.3 + j)) for i in range(11)]
        S.chain(pts, [(0.016, 0.016)] * 11, None, 'wattle' if j % 2 else 'wattled')
    S.build('hurdle', coll, C, subdiv=1)
    tuft(coll, 'tuft', (-L * 0.3 if v != 1 else L * 0.25, -0.1) if not along_y else (-0.1, -L * 0.3 if v != 1 else L * 0.25), 0.05)
    return dict(h=H + 0.2, w=(0.8 if along_y else L + 0.5), d=(L if along_y else 0.4))

PIECES = {}
for i in range(6): PIECES['stake_%d' % (i + 1)] = (lambda i: (lambda c: stake(c, i)))(i)
PIECES['stake_new'] = lambda c: stake(c, 6); PIECES['stake_stump'] = lambda c: stake(c, 7)
for i in range(3): PIECES['railPost_%d' % (i + 1)] = (lambda i: (lambda c: rail_post(c, i)))(i); PIECES['hurdle_%d' % (i + 1)] = (lambda i: (lambda c: hurdle(c, i)))(i); PIECES['hurdleV_%d' % (i + 1)] = (lambda i: (lambda c: hurdle(c, i, True)))(i)
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for name, fn in PIECES.items():
    if ONLY and name not in ONLY: continue
    rnd.seed(sum(ord(ch) for ch in name)); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 0.8 + cfg.get('d', 0) * 0.6; aim = H * 0.38
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel')
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
    print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
