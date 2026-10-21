"""The trees of the starter island as set pieces (2026-10-21, the kraken round: chosen tones, each crown one mass lit as one, a
ragged leafy rim instead of a crown of bumps, the pale fake-light clumps gone, the line only where colours meet; 2026-10-20; Robin picked concept A, "the printed tale book", then asked for more
outlines and a normal trunk). Three variants each of the pine, the oak and the birch, each with its own height, lean, limbs and
crown so a wood never repeats a tree, and for each kind a felled trunk and a log in its own bark. Built on the studio's
construction (skin.py: trunks and limbs as radius skeletons; crowns as clumps melted into one surface with tufts on the rim, in
overlapping clusters so the ink runs between them; pine tiers as lofted fans with ragged rims; thin ridges up the bark for its
lines) and rendered from the set pieces' camera: 35 degrees above the ground, 4 px a game unit when packed, twice that here.

  node tools/blender.js trees_build.py -- <out dir> [--kinds pine,oak,birch] [--variants 3] [--scale 1.0] [--only pine_2,oak_trunk]
      --scale multiplies every height (1.0: a pine of 5.6 m, three heroes; 0.75: 4.2 m, the size the game draws today)
  Writes <kind>_<n>.png, <kind>_trunk.png, <kind>_log.png and meta.json (the origin's pixel, the pixels a metre, the height)."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'                                   # the kraken round (2026-10-21)
from mathutils.bvhtree import BVHTree
from skin import Stick, loft, ball
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
def opt(k, d): return argv[argv.index(k) + 1] if k in argv else d
KINDS = opt('--kinds', 'pine,oak,birch').split(','); NV = int(opt('--variants', '3')); SCALE = float(opt('--scale', '1.0')); ONLY = opt('--only', '').split(',') if '--only' in argv else None
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2
rad = math.radians; TAU = 2 * math.pi
rnd = random.Random(1)
def U(a, b): return a + (b - a) * rnd.random()
HEIGHT = {'pine': 5.6, 'oak': 4.6, 'birch': 5.2}                              # concept A's, times SCALE

# ---------------------------------------------------------------- the scene and the helpers
def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Tree'); sc.collection.children.link(coll); return sc, coll
C = {}
FOLIAGE = ('needle', 'needlel', 'leaf', 'leafl', 'bleaf', 'bleafl')
def mats():
    # 2026-10-21: chosen greens a step deeper and more saturated than the meadow (#5d8d4c to #6b9a52), so a crown stands off the
    # ground in colour as well as in line; the bark's ridges a darker bark so the line falls on them (the line only at colour changes)
    for k, v in {'bark': '#6b4a36', 'barkline': '#43302a', 'oakbark': '#5c4634', 'oakline': '#3b2b22', 'birch': '#e9e2d2', 'bmark': '#2f2a28',
                 'needle': '#3a7a44', 'needlel': '#418049', 'leaf': '#478a33', 'leafl': '#4f9038', 'bleaf': '#7cae40', 'bleafl': '#88b84a',
                 'cut': '#d9c28c', 'ring': '#b58e58'}.items():
        if k in FOLIAGE:                                    # by day lush and bright: a lighter, smaller shade on the leaves
            lit, shade = toon.chosen_tones(v, lit_dl=0.09, shade_dl=0.075, cool_k=0.2)
            C[k] = toon.material('t_' + k, v, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
        else: C[k] = toon.material('t_' + k, v, None, 'cel')
def blob(name, coll, m, spheres, voxel=0.055, smooth_it=1, tufts=0, tuft_r=0.25):
    """balls melted into one surface (a voxel remesh, smoothed), with small balls grown on each clump's surface so the edge is
    scalloped like leaves and not a balloon"""
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
def one_form(objs, spheres=None, k=0.85, voxel=0.12, iters=22, grow=1.04):
    """the light from one smooth mass (the boar's lesson, 2026-10-21): each vertex takes its normal from the nearest point of a
    melted, heavily smoothed copy of the mass (its big balls without the tufts), blended k with its own"""
    coll = objs[0].users_collection[0]
    bm = bmesh.new()
    for (c, r, sc_) in spheres: bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r * grow, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((sc_[0], sc_[1], sc_[2], 1.0)))
    me = bpy.data.meshes.new('proxy_raw'); bm.to_mesh(me); bm.free(); pobj = bpy.data.objects.new('proxy_raw', me); coll.objects.link(pobj)
    rm = pobj.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel
    smd = pobj.modifiers.new('sm', 'SMOOTH'); smd.factor = 1.0; smd.iterations = iters
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); me2 = bpy.data.meshes.new_from_object(pobj.evaluated_get(dg))
    bpy.data.objects.remove(pobj); bpy.data.meshes.remove(me)
    PB = bmesh.new(); PB.from_mesh(me2); PB.normal_update(); T = BVHTree.FromBMesh(PB)
    for o in objs:
        om = o.data; vn = []
        for v in om.vertices:
            hit = T.find_nearest(o.matrix_world @ v.co); n = hit[1].normalized() if hit and hit[1] is not None else None
            vn.append(((n * k + v.normal * (1 - k)).normalized())[:] if n is not None else v.normal[:])
        om.normals_split_custom_set_from_vertices(vn)
    PB.free(); bpy.data.meshes.remove(me2)
def trunk_pts(h, lean, wobble, n=7, bend=0.0, ph=1.0):
    pts = []
    for i in range(n + 1):
        t = i / n; z = h * t; x = lean * z + wobble * math.sin(t * 5.1 + ph) * t + bend * t ** 3; y = wobble * 0.6 * math.cos(t * 4.3 + 2.0 * ph) * t
        pts.append(Vector((x, y, z)))
    return pts
def cone_tier(name, coll, c, r, ht, m, ragged=0.2, seg=18, droop=0.04, k=0):
    rings = [((c[0], c[1], c[2] - droop), r, r * 0.92), ((c[0], c[1], c[2] + ht * 0.45), r * 0.55, r * 0.5), ((c[0], c[1], c[2] + ht), r * 0.1, r * 0.1)]
    loft(name, coll, m, rings, seg=seg, wave=lambda row, a: 1 + (ragged * math.sin(a * 7 + k) + ragged * 0.6 * math.sin(a * 11 + k * 2)) * (1 if row == 0 else 0.3), closed=True)
def cut_disc(name, coll, c, r, axis):
    ax = (Vector(axis).normalized() + Vector((0, -0.9, 0.5))).normalized(); q = ax.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    for nm, rr, mk, dz in (('_face', r * 0.98, 'cut', 0.0), ('_ring', r * 0.55, 'ring', 0.004)):
        bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=16, radius=rr); bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ q @ Matrix.Translation((0, 0, dz)), verts=bm.verts)
        me = bpy.data.meshes.new(name + nm); bm.to_mesh(me); bm.free(); me.materials.append(C[mk]); o = bpy.data.objects.new(name + nm, me); coll.objects.link(o)
def bark_lines(S, pts, radii, mat, n=3, ph=0.0):
    """thin ridges up the trunk in the bark's own colour: Freestyle draws their edges as the lines of the bark"""
    for j in range(n):
        a = -0.9 + j * 1.1 + U(-0.2, 0.2) + ph; ch = []
        for i in range(1, len(pts) - 1): r = radii[min(i, len(radii) - 1)]; ch.append(pts[i] + Vector((math.cos(a + 0.25 * i) * r * 0.97, math.sin(a + 0.25 * i) * r * 0.97, 0)))
        S.chain(ch, (0.014, 0.011), None, mat)
def marks(coll, pts, radii, n, count):
    """the birch's dark marks: flat patches on the bark, each its own size, most on the side we see"""
    for k in range(count):
        i = 1 + int(U(0, n - 2)); a = U(-2.9, -0.3) if k % 4 else U(0.3, 2.9); r = radii[i]; p = pts[i] + Vector((math.cos(a) * r * 0.86, math.sin(a) * r * 0.86, U(-0.15, 0.15)))
        ball('mark%d' % k, coll, C['bmark'], p, r * U(0.6, 1.1), 0.35, 1.0, 0.45, rot=Matrix.Rotation(a, 3, 'Z'))

# ---------------------------------------------------------------- the trees
def pine(coll, v):
    h = HEIGHT['pine'] * SCALE * U(0.92, 1.08); S = Stick(); lean = U(-0.03, 0.03); wob = U(0.02, 0.06); n_t = 5 if v != 2 else 6
    radii = [0.13 * (1 - 0.8 * i / 7) + 0.02 for i in range(8)]; radii[0] = 0.185
    pts = trunk_pts(h, lean, wob, ph=U(0, 3)); idx = S.chain(pts, [(r, r) for r in radii], None, 'bark'); base = idx - 7
    bark_lines(S, pts, radii, 'barkline', 3, U(0, 2))
    for (z, a, l) in ((0.36, U(0, TAU), 0.7), (0.46, U(0, TAU), 0.6), (0.58, U(0, TAU), 0.55)):   # boughs showing under the fans
        p0 = pts[int(round(z * 7))].copy(); p0.z = h * z; S.chain([p0 + Vector((math.cos(a) * l * 0.5, math.sin(a) * l * 0.5, -0.02)), p0 + Vector((math.cos(a) * l, math.sin(a) * l, -0.06))], (0.075, 0.045), base + int(round(z * 7)), 'bark')
    S.build('trunk', coll, C, subdiv=2)
    for i in range(n_t):                                                        # flat fans with the trunk showing between: Bilibin's stacked cones
        t = i / (n_t - 1); z = h * (0.32 + 0.56 * t); r = (1.05 - 0.72 * t) * U(0.9, 1.1) * (0.95 if n_t == 6 else 1); c = pts[int(round(t * 7))]
        cone_tier('tier%d' % i, coll, (c.x + U(-0.04, 0.04), c.y + U(-0.04, 0.04), z), r, 0.42 + 0.18 * (1 - t), C['needle'] if i % 2 else C['needlel'], ragged=U(0.2, 0.28), droop=0.04, k=i * 3 + v * 7)
    cone_tier('top', coll, (pts[-1].x, pts[-1].y, h * 0.86), 0.26, 0.95, C['needle'], ragged=0.2, k=9 + v)
    tiers = [o for o in coll.objects if o.name.startswith('tier') or o.name == 'top']          # 2026-10-21: the whole pine lit as one cone
    one_form(tiers, spheres=[((pts[int(round(t * 7))].x, pts[int(round(t * 7))].y, h * (0.34 + 0.56 * t)), (1.05 - 0.78 * t) * 0.95, (1, 1, 0.75)) for t in [i / 7 for i in range(8)]], k=0.6, voxel=0.1, iters=16)
    return dict(h=h, w=3.2)

def oak(coll, v):
    h = HEIGHT['oak'] * SCALE * U(0.92, 1.08); S = Stick(); fork = h * U(0.38, 0.45); lean = U(-0.04, 0.04); wob = U(0.03, 0.07); rt = 0.3 * U(0.92, 1.08)
    pts = trunk_pts(fork, lean, wob, n=4, ph=U(0, 3)); radii = [rt * 1.25, rt, rt * 0.92, rt * 0.88, rt * 0.85]
    idx = S.chain(pts, [(radii[0] * 1.08, radii[0] * 0.95), (rt, rt * 0.95), (rt * 0.92, rt * 0.9), (rt * 0.88, rt * 0.85), (rt * 0.85, rt * 0.8)], None, 'oakbark')
    bark_lines(S, pts, radii, 'oakline', 3, U(0, 2))
    limbs = []; na = (3, 4, 5)[v % 3]; a0 = U(0, TAU)
    for i in range(na):
        a = a0 + i * TAU / na + U(-0.3, 0.3); l = h * 0.3 * U(0.85, 1.15); top = pts[-1]
        end = top + Vector((math.cos(a) * l * 0.75, math.sin(a) * l * 0.6, l * 0.75 + U(-0.1, 0.1)))
        mid = top + (end - top) * 0.5 + Vector((math.cos(a + 1.2) * 0.15, math.sin(a + 1.2) * 0.15, 0.05)); S.chain([mid, end], (rt * 0.55, rt * 0.3), idx, 'oakbark'); limbs.append((end, l))
    S.build('trunk', coll, C, subdiv=2)
    cr = h * 0.36 * U(0.9, 1.1); cz = fork + h * 0.33
    # 2026-10-21 (the kraken round): the crown as a few big lobes melted into one, one lobe over each limb and two in the middle, with
    # small tufts on their surfaces for a ragged leafy rim; the light from the lobes' smooth melt, so the crown reads as one mass
    # lit from the upper left; no pale clumps faking the light (the chosen tones do it)
    lobes = [((end.x + U(-0.12, 0.12) * cr, end.y + U(-0.12, 0.12) * cr, end.z + U(0.05, 0.25) * cr), cr * U(0.62, 0.74), (1.0, 0.9, 0.78)) for (end, l) in limbs]
    lobes += [((0, 0, cz + cr * 0.2), cr * 0.85, (1.0, 0.9, 0.8)), ((U(-0.15, 0.15) * cr, -0.05 * cr, cz + cr * 0.62), cr * 0.62, (1, 0.92, 0.8))]
    # a few big leaf clumps on the front of the crown (2026-10-21): where one passes before another the ink draws an arc, so the
    # crown has a handful of leafy masses inside its outline; they take the crown's light, not their own
    front = []
    for j in range(4):
        a = U(-2.4, -0.7); el = U(-0.35, 0.55); c0 = lobes[min(j, len(lobes) - 1)][0]
        front.append(((c0[0] * 0.5 + math.cos(a) * cr * 0.55, c0[1] * 0.5 + math.sin(a) * cr * 0.62 - cr * 0.2, cz + cr * (0.25 + el)), cr * U(0.38, 0.46), (1.0, 0.85, 0.8)))
    crown = blob('crown', coll, C['leaf'], lobes + front, voxel=0.038, smooth_it=1, tufts=12, tuft_r=0.27)
    one_form([crown], spheres=lobes, k=0.85)
    return dict(h=h, w=cr * 2.6 + 1.6)

def birch(coll, v):
    h = HEIGHT['birch'] * SCALE * U(0.92, 1.08); S = Stick(); lean = U(-0.05, 0.05); wob = U(0.03, 0.07); n = 14; r0 = 0.11 * U(0.92, 1.08)
    pts = trunk_pts(h * 0.78, lean, wob, n=n, ph=U(0, 3)); last = None; radii = []
    for i, p in enumerate(pts):
        r = r0 * (1 - 0.7 * i / n) + 0.02; radii.append(r); last = S.add(p, (r * (1.15 if i == 0 else 1), r * (1.12 if i == 0 else 1)), last, 'birch', root=(i == 0))
    S.build('trunk', coll, C, subdiv=2); marks(coll, pts, radii, n, (8, 10, 12)[v % 3])
    top = pts[n]; sph = []; nc = (6, 7, 6)[v % 3]
    for i in range(nc):                                                         # drooping clumps hanging from the crown
        a = i * TAU / nc + U(-0.3, 0.3); d = U(0.4, 0.9); sph.append(((top.x + math.cos(a) * d, top.y + math.sin(a) * d * 0.8, top.z + 0.3 - d * 0.9 + U(0, 0.3)), U(0.28, 0.42), (1.0, 0.9, 1.6)))
    sph.append(((top.x, top.y, top.z + 0.7), 0.55, (1.0, 0.9, 1.0))); sph.append(((top.x + U(-0.1, 0.1), top.y, top.z + 0.2), 0.5, (1.0, 0.9, 1.15)))   # a clump at the middle too, so the crown never splits round the trunk (birch_3 did)
    # 2026-10-21 (the kraken round): the hanging clumps melted into one crown with a ragged rim, lit as one mass
    allsp = []
    for sp in sph: allsp += [sp, ((sp[0][0] + U(-0.1, 0.1), sp[0][1] + U(-0.1, 0.1), sp[0][2] - sp[1] * 0.5), sp[1] * 0.7, (1, 0.9, 1.4))]
    crown = blob('crown', coll, C['bleaf'], allsp, voxel=0.036, smooth_it=1, tufts=8, tuft_r=0.3)
    one_form([crown], spheres=sph, k=0.8, voxel=0.1)
    return dict(h=h, w=2.8)

BARK = {'pine': ('bark', 0.17), 'oak': ('oakbark', 0.22), 'birch': ('birch', 0.12)}
def trunk(coll, kind):
    """a felled tree lying along the ground, its chopped end toward where it fell from (-X), two broken branch stubs"""
    l = HEIGHT[kind] * SCALE * 0.62; m, r = BARK[kind]; S = Stick()
    pts = [Vector((-l / 2 + l * i / 6, 0.02 * math.sin(i * 1.7), r * 0.95 + 0.02 * math.cos(i))) for i in range(7)]
    idx = S.chain(pts, [(r, r * 0.9)] * 3 + [(r * 0.9, r * 0.82)] * 2 + [(r * 0.8, r * 0.72)] * 2, None, m)
    for (t, a, ln) in ((0.45, 0.9, 0.5), (0.72, 2.4, 0.4)): p0 = pts[int(t * 6)]; S.chain([p0 + Vector((0, math.sin(a) * ln * 0.5, math.cos(a) * ln * 0.5 + 0.05)), p0 + Vector((0.1, math.sin(a) * ln, math.cos(a) * ln + 0.1))], (0.06, 0.035), idx - 6 + int(t * 6), m)
    for j in range(3): S.chain([q + Vector((0, -math.cos(0.5 + j * 0.7) * r * 0.95, math.sin(0.5 + j * 0.7) * r * 0.95 - r * 0.95)) for q in pts[1:6]], (0.014, 0.011), None, m)
    S.build('trunk', coll, C, subdiv=2); cut_disc('cut', coll, pts[0] + Vector((-0.02, 0, 0)), r * 0.98, (-1, 0, 0))
    if kind == 'birch': marks(coll, [Vector((p.x, p.y, 0)) for p in pts], [r] * 7, 6, 5)
    return dict(h=0.6, w=l + 1.2)
def log(coll, kind):
    m, r = BARK[kind]; r *= 0.9; l = 1.0; S = Stick()
    pts = [Vector((-l / 2, 0, r * 0.95)), Vector((0, 0.01, r * 0.97)), Vector((l / 2, 0, r * 0.95))]; S.chain(pts, (r, r), None, m)
    for j in range(2): S.chain([q + Vector((0, -math.cos(0.6 + j * 0.9) * r * 0.95, math.sin(0.6 + j * 0.9) * r * 0.95 - r * 0.95)) for q in pts], (0.013, 0.011), None, m)
    S.build('log', coll, C, subdiv=2)
    cut_disc('cutA', coll, pts[0] + Vector((-0.01, 0, 0)), r * 0.98, (-1, 0, 0)); cut_disc('cutB', coll, pts[-1] + Vector((0.01, 0, 0)), r * 0.98, (1, 0, 0))
    return dict(h=0.5, w=2.0)

# ---------------------------------------------------------------- render
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
jobs = []
for kind in KINDS:
    for v in range(1, NV + 1): jobs.append(('%s_%d' % (kind, v), lambda coll, kind=kind, v=v: {'pine': pine, 'oak': oak, 'birch': birch}[kind](coll, v - 1), 100 * KINDS.index(kind) + v))
    jobs.append(('%s_trunk' % kind, lambda coll, kind=kind: trunk(coll, kind), 900 + KINDS.index(kind))); jobs.append(('%s_log' % kind, lambda coll, kind=kind: log(coll, kind), 950 + KINDS.index(kind)))
for name, fn, seed in jobs:
    if ONLY and name not in ONLY: continue
    rnd.seed(seed); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 1.4; aim = H * 0.46
    cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(82)
    toon.piece_line(fs, at_colours=True)                   # 2026-10-21: the inner line only where colours meet or one mass passes before another
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2), 'scale': SCALE}
    print('TREE', name, sc.render.resolution_x, 'x', sc.render.resolution_y, 'height %.1f m' % H)
json.dump(meta, open(meta_p, 'w'), indent=1); print('TREES done:', len([j for j in jobs if not ONLY or j[0] in ONLY]))
