"""The plants (2026-10-21, the kraken round: chosen tones, each bush one mass lit as one with a ragged rim, no pale clumps, thicker reeds,
the line only where colours meet; the tall grass as Robin picked it). The plants of the starter island as set pieces (2026-10-20; art plan item 8, the third of Robin's order): the bush, the berry
bush, the juniper, the heather, the fern, the tall grass, the reeds and the toadstools. Drawn in the trees' hand (concept A, the
printed tale book, Robin's pick 2026-10-20) and rendered from the set pieces' camera as the trees and the benches were: 35 degrees
above the ground, looking north, 4 px a game unit when packed, twice that here. The old drawn bushes were dark blobs with a heavy
black ring and the toadstools as big as a boot (the art plan); these are lit clumps with a scalloped leafy edge in the oak's
greens, and the toadstools a hand high.

  bush        a low broad clump of melted balls, its edge scalloped, lit on the upper left, a few stems at the foot      1.55 to 1.9 m wide, waist high
  berryBush   the same, with a handful of red berries on the lit side (the one hot note, small)
  juniper     an upright dark flame of needles, a few blue berries                                                       1.3 to 1.6 m tall
  heather     a low grey-green cushion flecked with muted purple                                                         1.2 m wide, 0.4 m tall
  fern        seven to nine fronds arching out from a crown, each a serrated blade                                       about 1 m across
  tallGrass   a tuft of a dozen flat blades, three greens, two seed heads                                                0.8 m tall
  reeds       a clump of tall stalks with brown cattail heads and a few blade leaves                                     1.8 m tall
  mushrooms   a cluster of ochre toadstools of mixed size, matte                                                         up to 0.2 m tall

  node tools/blender.js plants_build.py -- <out dir> [--only bush_1,fern_2] [--variants 3]
  Writes <name>.png and meta.json (the origin's pixel, the pixels a metre), for tools/pieces_pack.js."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'                                   # the kraken round (2026-10-21)
from mathutils.bvhtree import BVHTree
from skin import Stick, ball
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
def opt(k, d): return argv[argv.index(k) + 1] if k in argv else d
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
ONLY = opt('--only', '').split(',') if '--only' in argv else None; NV = int(opt('--variants', '3'))
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2; rad = math.radians; TAU = 2 * math.pi
rnd = random.Random(7)
def U(a, b): return a + (b - a) * rnd.random()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}
GRASS = ('ggd', 'ggm', 'ggl', 'straw')
FOLIAGE = ('leaf', 'leafl', 'needle', 'needlel', 'heath', 'heathl', 'fern', 'fernl', 'reed', 'reedl')
def one_form(objs, spheres, k=0.85, voxel=0.08, iters=20, grow=1.04):
    """the light from one smooth mass (the trees' and the boar's way, 2026-10-21)"""
    coll = objs[0].users_collection[0]; bm = bmesh.new()
    for (c, r, sc_) in spheres: bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r * grow, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((sc_[0], sc_[1], sc_[2], 1.0)))
    me = bpy.data.meshes.new('proxy_raw'); bm.to_mesh(me); bm.free(); pobj = bpy.data.objects.new('proxy_raw', me); coll.objects.link(pobj)
    rm = pobj.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel
    smd = pobj.modifiers.new('sm', 'SMOOTH'); smd.factor = 1.0; smd.iterations = iters
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); me2 = bpy.data.meshes.new_from_object(pobj.evaluated_get(dg))
    bpy.data.objects.remove(pobj); bpy.data.meshes.remove(me)
    PB = bmesh.new(); PB.from_mesh(me2); PB.normal_update(); Tr = BVHTree.FromBMesh(PB)
    for o in objs:
        om = o.data; vn = []
        for v in om.vertices:
            hit = Tr.find_nearest(o.matrix_world @ v.co); n = hit[1].normalized() if hit and hit[1] is not None else None
            vn.append(((n * k + v.normal * (1 - k)).normalized())[:] if n is not None else v.normal[:])
        om.normals_split_custom_set_from_vertices(vn)
    PB.free(); bpy.data.meshes.remove(me2)
def mats():
    # 2026-10-21 (the kraken round): chosen tones; the leaves a step deeper and more saturated than the meadow, beside the trees'
    # greens, with a lighter, smaller shade (by day lush and bright); the tall grass (Robin's pick earlier today) keeps its tone
    for k, v in {'leaf': '#4f8f38', 'leafl': '#5a9a40', 'needle': '#356f42', 'needlel': '#3e7a49', 'heath': '#5f7c46', 'heathl': '#6f8c52', 'bloom': '#8f5886',
                 'fern': '#4a8a38', 'fernl': '#5c9c44', 'grassd': '#4c7a38', 'grass': '#6a9a44', 'grassl': '#8ab45a', 'ggd': '#4f7f42', 'ggm': '#75a258', 'ggl': '#a3bf6e', 'straw': '#c9b870', 'reed': '#6f9a48', 'reedl': '#86ac56',
                 'cattail': '#6a4630', 'stem': '#6b4a36', 'berry': '#c43a3a', 'jberry': '#6f7f9a', 'cap': '#b8843e', 'capd': '#985f34', 'stalk': '#e2d6bc', 'fleck': '#ece2cc'}.items():
        if k in GRASS: C[k] = toon.material('p_' + k, v, None, 'cel', shared=True)
        elif k in FOLIAGE:
            lit, shade = toon.chosen_tones(v, lit_dl=0.09, shade_dl=0.075, cool_k=0.2)
            C[k] = toon.material('p_' + k, v, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
        else: C[k] = toon.material('p_' + k, v, None, 'cel')
def obj(name, coll, bm, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def blob(name, coll, m, spheres, voxel=0.045, smooth_it=1, tufts=0, tuft_r=0.25):
    """balls melted into one surface (a voxel remesh, smoothed), with small balls grown on each clump's surface so the edge is
    scalloped like leaves and not a balloon (the trees' crowns)"""
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
def strip(name, coll, m, pts, widths, thick=0.012, droop=0.0):
    """a flat blade or frond: a ribbon of quads along pts (a 3D curve), widths[i] the half width at each point across the
    horizontal perpendicular, its two edges hanging a little (droop); given thickness by a Solidify so both faces render"""
    bm = bmesh.new(); rows = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]); d.z = 0
        if d.length < 1e-6: d = Vector((1, 0, 0))
        n = Vector((-d.y, d.x, 0)).normalized(); w = widths[i]
        rows.append((bm.verts.new(p - n * w - Vector((0, 0, droop * w))), bm.verts.new(p + n * w - Vector((0, 0, droop * w)))))
    for (a0, b0), (a1, b1) in zip(rows, rows[1:]):
        if (a0.co - b0.co).length < 1e-5 and (a1.co - b1.co).length < 1e-5: continue
        try: bm.faces.new((a0, b0, b1, a1))
        except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    o = obj(name, coll, bm, m); so = o.modifiers.new('Solid', 'SOLIDIFY'); so.thickness = thick; so.offset = 0; return o
def arc_pts(origin, th, L, rise, peak=0.45, n=16, sway=0.0, droop_end=0.0):
    """the spine of a frond or blade: out along th for L, rising to `rise` at `peak` of the way and down again by droop_end"""
    pts = []
    for i in range(n + 1):
        t = i / n; r = L * t; z = rise * (math.sin(math.pi * min(1, t / peak * 0.5)) if t < peak else math.cos(math.pi * 0.5 * (t - peak) / (1 - peak)))
        z = origin[2] + z - droop_end * max(0, t - peak) ** 2
        pts.append(Vector((origin[0] + math.cos(th) * r + math.cos(th + 1.57) * sway * t * t, origin[1] + math.sin(th) * r + math.sin(th + 1.57) * sway * t * t, z)))
    return pts
def stems(S, c, n, h, r, spread):
    for i in range(n): a = U(0, TAU); S.chain([Vector((c[0] + math.cos(a) * spread * 0.3, c[1] + math.sin(a) * spread * 0.3, 0)), Vector((c[0] + math.cos(a) * spread, c[1] + math.sin(a) * spread, h))], (r, r * 0.8), None, 'stem')

# ---- the kinds -------------------------------------------------------------------------------------------------------
def bush(coll, v, berries=False):
    W = U(1.55, 1.9) * (0.92 if berries else 1.0); H = W * U(0.62, 0.72); S = Stick()                            # waist high on the hero: a thing he picks from
    stems(S, (0, 0), 4, H * 0.45, 0.025, W * 0.18); S.build('stems', coll, C, subdiv=2)
    cl = []
    for k in range(3 + v % 2):                         # 2026-10-21: a few big lobes melted into one, a ragged rim, lit as one (no pale clumps faking the light)
        a = TAU * k / (3 + v % 2) + U(-0.3, 0.3); rr = W * U(0.2, 0.25); cl.append(((math.cos(a) * W * 0.2, math.sin(a) * W * 0.16, H * 0.5 + U(-0.04, 0.05)), rr, (1.25, 1.0, 0.85)))
    cl.append(((0, 0, H * 0.62), W * 0.27, (1.2, 1.0, 0.8)))
    crown = blob('crown', coll, C['leaf'], cl, voxel=0.032, tufts=11, tuft_r=0.27)
    one_form([crown], cl, k=0.85)
    if berries:
        for k in range(11 + v * 2):
            a = U(-2.9, -0.2); ball('berry%d' % k, coll, C['berry'], (math.cos(a) * W * U(0.3, 0.42), math.sin(a) * W * U(0.26, 0.36), H * U(0.55, 0.92)), 0.05)
    return dict(h=H + 0.15, w=W + 0.4)
def juniper(coll, v):
    H = U(1.3, 1.6); W = H * U(0.42, 0.5); S = Stick(); stems(S, (0, 0), 2, H * 0.3, 0.03, W * 0.1); S.build('stems', coll, C, subdiv=2)
    cl = [((0, 0, H * 0.3), W * 0.46, (1.0, 0.9, 1.1)), ((U(-0.05, 0.05), U(-0.05, 0.05), H * 0.58), W * 0.4, (1.0, 0.9, 1.25)), ((U(-0.04, 0.04), 0, H * 0.84), W * 0.24, (1.0, 0.9, 1.3))]
    body = blob('body', coll, C['needle'], cl, voxel=0.03, tufts=10, tuft_r=0.3); one_form([body], cl, k=0.8)
    for k in range(4 + v): a = U(-2.6, 0.4); ball('jb%d' % k, coll, C['jberry'], (math.cos(a) * W * 0.36, math.sin(a) * W * 0.3 - 0.04, H * U(0.35, 0.7)), 0.028)
    return dict(h=H + 0.1, w=W + 0.5)
def heather(coll, v):
    W = U(1.1, 1.35); H = U(0.34, 0.42)
    cl = [((math.cos(a) * W * 0.26, math.sin(a) * W * 0.2, H * 0.45), W * U(0.16, 0.22), (1.2, 1.0, 0.55)) for a in [TAU * k / (4 + v) + U(-0.3, 0.3) for k in range(4 + v)]] + [((0, 0, H * 0.5), W * 0.25, (1.3, 1.0, 0.6))]
    cush = blob('cushion', coll, C['heath'], cl, voxel=0.03, tufts=14, tuft_r=0.24); one_form([cush], cl, k=0.8)
    # 2026-10-21: the heather in flower as a big mass, not dots: a ragged purple crown over most of the cushion's top, lit with it
    bl = [((math.cos(a) * rr, math.sin(a) * rr * 0.8, H * 0.98 - rr * 0.35), W * U(0.12, 0.16), (1.3, 1.0, 0.5)) for a, rr in [(U(0, TAU), W * U(0.0, 0.3)) for _ in range(8 + v)]]
    crown = blob('bloom', coll, C['bloom'], bl, voxel=0.028, tufts=10, tuft_r=0.3); one_form([crown], cl, k=0.8)
    return dict(h=H + 0.1, w=W + 0.4)
def fern(coll, v):
    R = U(0.5, 0.6); n = 6 + v; H = R * 0.85
    blob('crown', coll, C['fern'], [((0, 0, 0.06), 0.12, (1.0, 0.9, 0.6))], tufts=4, tuft_r=0.3)
    for k in range(n):
        th = TAU * k / n + U(-0.2, 0.2); L = R * U(0.85, 1.15); npin = 6
        pts = arc_pts((math.cos(th) * 0.04, math.sin(th) * 0.04, 0.04), th, L, H * U(0.75, 1.0), peak=U(0.4, 0.5), n=npin * 2, sway=U(-0.08, 0.08), droop_end=L * 0.5)
        widths = []
        for i in range(npin * 2 + 1):
            t = i / (npin * 2); w = L * 0.22 * math.sin(math.pi * (0.06 + 0.94 * t)) ** 0.7 + 0.01
            widths.append(w * (1.0 if i % 2 == 0 else 0.8) if 0 < i < npin * 2 else 0.012)
        strip('frond%d' % k, coll, C['fern'] if k % 2 else C['fernl'], pts, widths, thick=0.014, droop=0.12)
    return dict(h=H + 0.1, w=R * 2.4 + 0.3)
# the grass greens ggd/ggm/ggl sit a step lighter than the game's ink-look grass (#3d6a33, #5f8a44, #8aa65a): the cel's shade brings them down to it
def tall_grass(coll, v):
    """meadow grass (redone 2026-10-21; Robin: the first tuft "looks like a plant"; the second inked to a scribble at game size):
    a loose tussock of fourteen broad flat blades in the game's own grass colours (the drawn tufts' dark, mid and light), no
    body, no inner ink, rising from a hand's width of ground and all leaning one way as grass does in a wind; the lit tone on
    the leaning side; two seed heads. Knee to thigh high, as wide as tall."""
    n = 13 + v; H = U(0.6, 0.75); lean_dir = U(0.0, TAU); lean = U(0.3, 0.45)
    for k in range(n):
        th = TAU * k / n + U(-0.25, 0.25); r0 = U(0.03, 0.14); h = H * U(0.5, 1.0)
        base = (math.cos(th) * r0, math.sin(th) * r0, 0); pts = []; m = 6
        for i in range(m + 1):
            t = i / m; bend = lean * h * t * t; out = r0 * 0.5 * t
            pts.append(Vector((base[0] + math.cos(lean_dir) * bend + math.cos(th) * out, base[1] + math.sin(lean_dir) * bend + math.sin(th) * out, h * t)))
        widths = [0.11 * (1 - t / m) ** 0.7 + 0.012 for t in range(m + 1)]
        tone = 'ggl' if math.cos(th - lean_dir) > 0.2 else ('ggm' if k % 3 else 'ggd')
        strip('blade%d' % k, coll, C[tone], pts, widths, thick=0.02)
        if h > H * 0.92 and k % 6 == 1: ball('seed%d' % k, coll, C['straw'], pts[-1] + Vector((0, 0, 0.02)), 0.02, 1.0, 1.0, 3.0)
    return dict(h=H + 0.08, w=1.1)
def reeds(coll, v):
    n = 5 + v; H = U(1.7, 1.95); S = Stick()
    blob('tussock', coll, C['reed'], [((0, 0, 0.08), 0.16, (1.2, 0.9, 0.5))], tufts=6, tuft_r=0.3)
    for k in range(n):
        a = TAU * k / n + U(-0.3, 0.3); rr = U(0.05, 0.28); x, y = math.cos(a) * rr, math.sin(a) * rr * 0.7; h = H * U(0.72, 1.0); lean = U(-0.08, 0.08)
        S.chain([Vector((x, y, 0)), Vector((x + lean * 0.5, y, h * 0.5)), Vector((x + lean, y + U(-0.04, 0.04), h))], [(0.05, 0.047), (0.044, 0.041), (0.034, 0.03)], None, 'reed' if k % 2 else 'reedl')   # 2026-10-21: thicker, so not a black stick
        if k % 2 == 0: ball('head%d' % k, coll, C['cattail'], (x + lean * 0.86, y, h * 0.86), 0.068, 1.0, 1.0, 3.0)
    S.build('stalks', coll, C, subdiv=2)
    for k in range(4 + v):
        th = TAU * k / (4 + v) + U(-0.4, 0.4); L = U(0.3, 0.5)
        pts = arc_pts((0, 0, 0), th, L, H * U(0.5, 0.7), peak=0.75, n=10, sway=U(-0.1, 0.1))
        strip('leaf%d' % k, coll, C['reedl' if k % 2 else 'reed'], pts, [0.065 * (1 - i / 10) ** 0.6 + 0.008 for i in range(11)], thick=0.012)
    return dict(h=H + 0.1, w=1.3)
def mushrooms(coll, v):
    n = 3 + v * 2 if v < 2 else 2; S = Stick(); H = 0.0
    for k in range(n):
        a = TAU * k / n + U(-0.4, 0.4); rr = 0.12 + 0.12 * (k % 2) if n > 2 else 0.14; x, y = math.cos(a) * rr, math.sin(a) * rr * 0.7
        h = U(0.17, 0.3) if k % 2 == 0 else U(0.1, 0.18); cr = h * U(0.6, 0.72); tilt = U(-0.25, 0.25); H = max(H, h + cr * 0.5)
        S.chain([Vector((x, y, 0)), Vector((x + tilt * h * 0.3, y, h * 0.6)), Vector((x + tilt * h * 0.5, y, h))], [(0.03 * h / 0.15 + 0.012, 0.028 * h / 0.15 + 0.01), (0.022 * h / 0.15 + 0.01, 0.02 * h / 0.15 + 0.01), (0.02 * h / 0.15 + 0.01, 0.018 * h / 0.15 + 0.01)], None, 'stalk')
        ball('cap%d' % k, coll, C['cap' if k % 3 else 'capd'], (x + tilt * h * 0.5, y, h + cr * 0.15), cr, 1.0, 1.0, 0.62)
        for j in range(3 if cr > 0.07 else 0): b = U(0, TAU); ball('fl%d_%d' % (k, j), coll, C['fleck'], (x + tilt * h * 0.5 + math.cos(b) * cr * 0.55, y + math.sin(b) * cr * 0.5, h + cr * 0.15 + cr * 0.45), cr * 0.14, 1.0, 1.0, 0.5)
    S.build('stalks', coll, C, subdiv=2)
    return dict(h=H + 0.06, w=0.9)

LINE = {'tallGrass': 0.35, 'reeds': 0.75, 'fern': 0.85}
NO_INNER = {'tallGrass'}                               # grass: the silhouette only, no inner lines (thin blades inked to a scribble at game size)
CREASE = {'bush': 82, 'berryBush': 82, 'juniper': 82, 'heather': 82}
KINDS = {'bush': lambda c, v: bush(c, v), 'berryBush': lambda c, v: bush(c, v, True), 'juniper': juniper, 'heather': heather, 'fern': fern, 'tallGrass': tall_grass, 'reeds': reeds, 'mushrooms': mushrooms}
meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for ki, (kind, fn) in enumerate(KINDS.items()):
    for v in range(NV):
        name = '%s_%d' % (kind, v + 1)
        if ONLY and name not in ONLY: continue
        rnd.seed(100 * ki + v + 3); sc, coll = fresh(); C.clear(); mats(); cfg = fn(coll, v)
        toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
        H, W = cfg['h'], cfg['w']; vw = W; vh = H * 0.9 + 0.7; aim = H * 0.38
        cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
        toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
        fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(CREASE.get(kind, 100)); lk = LINE.get(kind, 1.0)
        toon.piece_line(fs, at_colours=True)               # 2026-10-21: the inner line only where colours meet or one mass passes before another
        if kind in NO_INNER: fs.linesets.remove(fs.linesets['inner'])
        for ls in fs.linesets:
            st = ls.linestyle; st.thickness *= lk
            for md in st.thickness_modifiers:
                if hasattr(md, 'thickness_min'): md.thickness_min *= lk; md.thickness_max *= lk
        sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
        a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
        meta[name] = {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': round(H, 2)}
        print('PIECE', name, sc.render.resolution_x, 'x', sc.render.resolution_y)
json.dump(meta, open(meta_p, 'w'), indent=1); print('PIECES done')
