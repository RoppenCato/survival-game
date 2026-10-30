"""The final pier pieces (Colin, AD, 2026-10-30; Robin said yes to the assembly board, draft C3). Built on the drafts' file: three drafts of a small shipyard that is part of a pier (Colin, AD, 2026-10-30; Robin, through Clive, GD: the naust is "absolutely huge";
"a nice part of a pier", pieces to build piers, built from the beach out over the shallows, one or two pieces may reach inland; the hull
always shows outside the pier in the water, side on). Viking-age carpentry where we know it: plank jetties on driven piles (Hedeby), log
cribs filled with stone, split logs, treenails, turf roofs, withy and rope lashings. No stocks: the hull is the game's ship sheet.

  A  plank pier on piles, a lean-to with a turf roof on its beach end: bench, planks, tools
  B  split-log pier on log trestles, sheer legs at its head leaning out over the water, a tackle hanging; timber stack, tar pot
  C  plank pier on stone-filled log cribs, a cross-stage at its end facing the hull: trestles, bent ribs, a rail
  float  the work float that lies beside the hull, drawn apart from the pier; repeats along any hull
  kit_A, kit_B, kit_C  the buildable pieces of each, laid out in a row

Each scene writes <name>.png and meta (the anchor, and in metres the piles and the decks, for the water rings and shadows drawn on the board).
  node tools/blender.js pier_build.py -- <out dir> [--only names]"""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
ONLY = argv[argv.index('--only') + 1].split(',') if '--only' in argv else None
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2; rad = math.radians; TAU = 2 * math.pi; E = math.asin(0.75)
TILE = 32 / UNIT; W2 = 1.3; Z = 0.72                     # a tile in metres; the deck's half width; its height over water and sand
rnd = random.Random(31)
def U(a, b): return a + (b - a) * rnd.random()
def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll); return sc, coll
C = {}; META = {}
LEAFY = ('turf', 'moss')
def mats():
    for k, v in {'deck': '#9c8466', 'deckl': '#b09878', 'deckd': '#826c52', 'pile': '#6a5644', 'piled': '#4e4034', 'wet': '#3e3a34', 'log': '#8a6c4c', 'logend': '#c4a478', 'fresh': '#c9a26a', 'freshd': '#a8844f',
                 'stone': '#8f8a7e', 'stoned': '#6f6b62', 'turf': '#6a8648', 'moss': '#6e8a46', 'rope': '#c0a87c', 'tar': '#3a2c24', 'iron': '#5a5f64', 'withy': '#a8926a', 'fish': '#c8c8b4', 'cloth': '#b8a888', 'horn': '#ddd0b0'}.items():
        if k in LEAFY:
            lit, shade = toon.chosen_tones(v, lit_dl=0.09, shade_dl=0.08, cool_k=0.22); C[k] = toon.material('m_' + k, v, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
        elif k.startswith('stone'): C[k] = toon.material('m_' + k, v, None, 'cel', t_dark=0.62, t_lit=0.95)
        else: C[k] = toon.material('m_' + k, v, None, 'cel')
class S:                                                  # the scene being built
    coll = None; piles = []; decks = []
def obj(name, bm, m, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(C[m])
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); S.coll.objects.link(o); return o
def box(m, c, size, rz=0.0, rx=0.0, ry=0.0, bevel=0.1):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); R = Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rx, 4, 'X')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ R @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
    if bevel: bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(size) * bevel, segments=1, affect='EDGES')
    return obj('b', bm, m)
def cyl(m, p0, p1, r, seg=10, r1=None):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; q = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r1 if r1 is not None else r * 0.94, depth=d.length)
    bmesh.ops.transform(bm, matrix=Matrix.Translation((p0 + p1) / 2) @ q, verts=bm.verts); return obj('c', bm, m, True)
def ball(m, c, r, s=(1, 1, 1)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((s[0], s[1], s[2], 1.0))); return obj('s', bm, m, True)
def pile(x, y, top, r=0.11):
    cyl('pile', (x, y, -0.02), (x, y, top), r); cyl('wet', (x, y, -0.02), (x, y, 0.16), r * 1.04); S.piles.append((x, y, r))   # the tide's dark band at its foot
def stones(x, y, rr, n=5):
    for i in range(n): a = TAU * i / n + U(-0.3, 0.3); ball('stoned' if i % 2 else 'stone', (x + math.cos(a) * rr, y + math.sin(a) * rr * 0.8, 0.07), U(0.12, 0.2), (1.2, 1, 0.7))
def mooring(x, y, h=1.25):
    cyl('pile', (x, y, Z - 0.3), (x, y, Z + h * 0.62), 0.085); ball('pile', (x, y, Z + h * 0.62), 0.09, (1, 1, 0.5))
    for k in range(3): cyl('rope', (x, y, Z + 0.32 + k * 0.055), (x, y, Z + 0.37 + k * 0.055), 0.105, seg=12)
def coil(x, y, r=0.24):
    for k in range(3): cyl('rope', (x, y, Z + 0.03 + k * 0.05), (x, y, Z + 0.08 + k * 0.05), r - k * 0.015, seg=14)
    cyl('tar', (x, y, Z + 0.17), (x, y, Z + 0.18), r * 0.42, seg=10)
def barrel(x, y, m='log', zb=None, h=0.72, r=0.25):
    zb = Z + 0.03 if zb is None else zb; bm_r = [r * 0.82, r, r * 0.82]
    cyl(m, (x, y, zb), (x, y, zb + h / 2), bm_r[0], seg=12, r1=bm_r[1]); cyl(m, (x, y, zb + h / 2), (x, y, zb + h), bm_r[1], seg=12, r1=bm_r[2])
    for t in (0.2, 0.8): z_ = zb + h * t; cyl('withy', (x, y, z_), (x, y, z_ + 0.04), r * 0.96 + 0.015, seg=12)
    cyl('tar' if m == 'tar' else 'deckd', (x, y, zb + h), (x, y, zb + h + 0.01), bm_r[2] * 0.9, seg=12)

# ---- the pier as real pieces (Colin, AD, 2026-10-30; Robin picked C3: no stairs on the pieces, a rope net to climb up from the water, test real piers on every side).
#      Rendered from a camera whose tilt matches the game's ground (sin = 0.75, a tile 24 units deep): grid-locked decks must lie on the grid. A module is 2 by 2 tiles.
#      Faces with a normal to east or west do not show from this camera, and north faces are hidden, so only the SOUTH face needs a wall: deck + kerbs per open side + a wall if the south is open.
M = TILE * 2; H_W = TILE * 3; H_L = TILE * 2
_mats0 = mats
def mats():
    _mats0()
    for k, v in {'kerb': '#6e5a46', 'carve': '#7a6048', 'under': '#2e2a26', 'deckw': '#b4a68e', 'deckp': '#a08a66'}.items(): C[k] = toon.material('m_' + k, v, None, 'cel')
def top(w, d, run, seed=0, detail=None):                   # the boards, tones evened (the first ones banded along a long run). detail: a variant inside the same edges, so they still tile: knot, worn, patch, cleat
    r = random.Random(seed); ew = run == 'ew'; L = w if ew else d; Lc = d if ew else w; n = int(round(L / 0.3)); step = L / n; picks = []
    for i in range(n): u = r.random(); picks.append('deckl' if u < 0.18 else 'deckd' if u < 0.3 else 'deck')
    worn = set(r.sample(range(n), 3)) if detail == 'worn' else set()
    for i in range(n):
        c = -L / 2 + (i + 0.5) * step; t = 'deckw' if i in worn else picks[i]
        if ew: box(t, (c, 0, Z), (step * 0.94, d, 0.06), bevel=0.12)
        else: box(t, (0, c, Z), (w, step * 0.94, 0.06), bevel=0.12)
    P = (lambda a_, b_: (a_, b_)) if ew else (lambda a_, b_: (b_, a_))
    zt = Z + 0.034
    if detail == 'knot':
        for (a_, b_) in ((-0.55, 0.45), (0.8, -0.5)): q = P(a_, b_); ball('piled', (q[0], q[1], zt), 0.075, (1.3 if ew else 1, 1 if ew else 1.3, 0.1)); ball('tar', (q[0], q[1], zt + 0.006), 0.034, (1.2, 1.2, 0.1))
    if detail == 'worn':
        for i in sorted(worn)[:2]:
            c = -L / 2 + (i + 0.5) * step; a0, b0 = P(c, -0.75); a1, b1 = P(c, 0.25); box('piled', ((a0 + a1) / 2, (b0 + b1) / 2, zt), (0.02 if ew else 1.0, 1.0 if ew else 0.02, 0.006), bevel=0)   # a split along it
    if detail == 'patch':                                  # a mend: a short board nailed across, its four nails
        q = P(0.35, -0.2); sx, sy = (0.62, 0.95) if ew else (0.95, 0.62); box('deckp', (q[0], q[1], zt + 0.012), (sx, sy, 0.035), bevel=0.15)
        for ox in (-1, 1):
            for oy in (-1, 1): ball('iron', (q[0] + ox * (sx / 2 - 0.08), q[1] + oy * (sy / 2 - 0.08), zt + 0.034), 0.024, (1, 1, 0.4))
    if detail == 'cleat':                                  # a cleat by the south edge (or the east), to make fast to: a low block with two horns
        q = (0.2, -d / 2 + 0.3) if ew else (w / 2 - 0.3, 0.1); ax = (1, 0) if ew else (0, 1)
        box('kerb', (q[0], q[1], zt + 0.03), (0.16, 0.16, 0.07), bevel=0.2); cyl('carve', (q[0] - ax[0] * 0.24, q[1] - ax[1] * 0.24, zt + 0.1), (q[0] + ax[0] * 0.24, q[1] + ax[1] * 0.24, zt + 0.1), 0.045, seg=8)
        cyl('rope', (q[0], q[1], zt + 0.05), (q[0], q[1], zt + 0.09), 0.1, seg=10)
def kerb(p0, p1):
    cyl('kerb', (p0[0], p0[1], Z + 0.08), (p1[0], p1[1], Z + 0.08), 0.075, seg=8)
def wall(w, seed=1):                                       # the south face: logs laid tight, an upright at each end, stones at the foot (not cribs in steps)
    r = random.Random(seed); y = -0.02
    for k in range(4): cyl('log' if k % 2 else 'kerb', (-w / 2, y, 0.09 + k * 0.175), (w / 2, y, 0.09 + k * 0.175), 0.092, seg=8)
    for x in (-w / 2 + 0.05, w / 2 - 0.05): cyl('pile', (x, y - 0.05, 0.0), (x, y - 0.05, Z + 0.04), 0.075)
    for i in range(int(w * 2.2)): ball('stoned' if i % 3 == 0 else 'stone', (-w / 2 + (i + 0.5) * w / int(w * 2.2) + r.uniform(-0.08, 0.08), y - 0.14, 0.05), r.uniform(0.08, 0.14), (1.25, 0.9, 0.7))
def landing(side):                                         # the sand on this side: one smooth slope from the sand to the deck, boards drawn on it. (Level boards stepped up it read as stairs and showed the ground between them.)
    w = M; zl, zh = 0.04, Z; ew = side in 'ew'; s_ = {'w': -1, 'e': 1, 'n': 1, 's': -1}[side]; n = 10
    def pt(t, c): along = s_ * (w / 2 - t * w); h = zl + (zh - zl) * t; return (along, c, h) if ew else (c, along, h)
    bm = bmesh.new(); v = [bm.verts.new(pt(0, -w / 2)), bm.verts.new(pt(0, w / 2)), bm.verts.new(pt(1, w / 2)), bm.verts.new(pt(1, -w / 2))]; bm.faces.new(v); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); obj('ramp', bm, 'deckd')
    r = random.Random(11)
    for i in range(n):                                     # the boards, lying on the slope
        t0, t1 = (i + 0.04) / n, (i + 0.96) / n; bm = bmesh.new(); up = 0.012
        v = [bm.verts.new(tuple(q + (up if k == 2 else 0) for k, q in enumerate(pt(t, c)))) for t, c in ((t0, -w / 2), (t0, w / 2), (t1, w / 2), (t1, -w / 2))]; bm.faces.new(v); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            if f.normal.z < 0: bmesh.ops.reverse_faces(bm, faces=[f])
        obj('board', bm, ['deck', 'deckl', 'deck', 'deck', 'deckd'][r.randrange(5)])
    if ew:                                                 # the side you see: a skirt from the sand up to the deck, the logs' colour
        bm = bmesh.new(); a_ = bm.verts.new((s_ * w / 2, -w / 2, 0)); b_ = bm.verts.new((-s_ * w / 2, -w / 2, 0)); c_ = bm.verts.new((-s_ * w / 2, -w / 2, zh)); bm.faces.new((a_, b_, c_)); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            if f.normal.y > 0: bmesh.ops.reverse_faces(bm, faces=[f])
        obj('skirt', bm, 'log')
    for c in (-w / 2, w / 2): p0, p1 = pt(0, c), pt(1, c); cyl('kerb', (p0[0], p0[1], p0[2] + 0.07), (p1[0], p1[1], p1[2] + 0.07), 0.07, seg=8)
def carved(x, y, h=1.5, fx=0.0, fy=-1.0):
    cyl('carve', (x, y, Z - 0.05), (x, y, Z + h), 0.09, r1=0.07)
    for k in range(2): cyl('tar', (x, y, Z + h * 0.45 + k * 0.16), (x, y, Z + h * 0.45 + k * 0.16 + 0.05), 0.095, seg=10)
    ball('carve', (x, y, Z + h + 0.08), 0.15, (1, 1, 0.95)); cyl('carve', (x + fx * 0.06, y + fy * 0.06, Z + h + 0.07), (x + fx * 0.46, y + fy * 0.46, Z + h + 0.01), 0.09, r1=0.05)
    ball('tar', (x + fx * 0.1 + 0.09 * abs(fy), y + fy * 0.1 + 0.09 * abs(fx), Z + h + 0.16), 0.03); ball('tar', (x + fx * 0.1 - 0.09 * abs(fy), y + fy * 0.1 - 0.09 * abs(fx), Z + h + 0.16), 0.03)
def rope_rail(a, b, n=3):
    pts = [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n) for i in range(n + 1)]
    for p in pts: cyl('pile', (p[0], p[1], Z), (p[0], p[1], Z + 0.92), 0.05); ball('pile', (p[0], p[1], Z + 0.93), 0.06, (1, 1, 0.6))
    for p, q in zip(pts, pts[1:]):
        m = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, Z + 0.68); cyl('rope', (p[0], p[1], Z + 0.84), m, 0.03, seg=6); cyl('rope', m, (q[0], q[1], Z + 0.84), 0.03, seg=6)
# the head's local frame: u out to sea, v across. d = (ux, uy): the way out
def head_deck(d):
    ew = d[0] != 0; w, dp = (H_L, H_W) if ew else (H_W, H_L); top(w, dp, 'ns' if ew else 'ew', seed=5)
    hw, hd = w / 2, dp / 2; pw = M / 2                       # the kerbs: all round, broken where the pier comes in
    for (p, q) in (((-hw, -hd), (hw, -hd)), ((-hw, hd), (hw, hd)), ((-hw, -hd), (-hw, hd)), ((hw, -hd), (hw, hd))):
        horiz = p[1] == q[1]; onland = (horiz and d[1] != 0 and p[1] * d[1] < 0) or (not horiz and d[0] != 0 and p[0] * d[0] < 0)
        if not onland: kerb(p, q)
        elif horiz: kerb((-hw, p[1]), (-pw, p[1])); kerb((pw, p[1]), (hw, p[1]))
        else: kerb((p[0], -hd), (p[0], -pw)); kerb((p[0], pw), (p[0], hd))
HB = {}
def head_things(d):
    B_ = []; G_ = 39 / 1.8; add = lambda x0, y0, x1, y1, n: B_.append({'name': n, 'box': [round(min(x0, x1) * G_, 1), round(min(-y0, -y1) * G_, 1), round(max(x0, x1) * G_, 1), round(max(-y0, -y1) * G_, 1)]}); HB[d] = B_
    ux, uy = d; vx, vy = -uy, ux; U_ = H_L / 2; V_ = H_W / 2; P = lambda u, v: (ux * u + vx * v, uy * u + vy * v)
    a, b = P(U_ - 0.1, -V_ + 0.14), P(U_ - 0.1, V_ - 0.14)
    carved(a[0], a[1], 1.6, ux, uy); carved(b[0], b[1], 1.6, ux, uy); rope_rail(P(U_ - 0.08, -V_ + 0.4), P(U_ - 0.08, V_ - 0.4), 3); add(a[0] - 0.14 * abs(uy) - 0.12 * abs(ux), a[1] - 0.14 * abs(ux) - 0.12 * abs(uy), b[0] + 0.14 * abs(uy) + 0.12 * abs(ux), b[1] + 0.14 * abs(ux) + 0.12 * abs(uy), 'rail')
    t = P(-0.1, V_ - 1.0) if uy != 0 else P(-0.35, V_ - 1.15); box('fresh', (t[0], t[1], Z + 0.92), (1.5, 0.26, 0.07), bevel=0.15); add(t[0] - 0.75, t[1] - 0.26, t[0] + 0.75, t[1] + 0.26, 'trestle')   # the plank always lies east to west: north to south it stood on the screen like a pillar. (Longer than the stage, it stuck out past the edge.)
    for off in (-0.5, 0.5):
        for s_ in (-0.22, 0.22): cyl('log', (t[0] + off, t[1] + s_, Z), (t[0] + off, t[1], Z + 0.88), 0.04)
    st = P(0.3, -V_ + 0.9); cyl('log', (st[0], st[1], Z), (st[0], st[1], Z + 0.46), 0.17); cyl('iron', (st[0], st[1], Z + 0.47), (st[0] + 0.16, st[1] + 0.08, Z + 0.86), 0.022); add(st[0] - 0.2, st[1] - 0.2, st[0] + 0.2, st[1] + 0.2, 'stump')
    br = P(-0.75, -V_ + 0.45); barrel(br[0], br[1], 'tar', h=0.66, r=0.22); add(br[0] - 0.25, br[1] - 0.25, br[0] + 0.25, br[1] + 0.25, 'barrel'); co = P(-0.7, 0.05 - V_ + 1.1); coil(co[0], co[1])
def fish_rack(x, y, L=1.5):
    for dx in (-L / 2, L / 2):
        cyl('log', (x + dx, y - 0.32, Z), (x + dx, y, Z + 1.25), 0.05); cyl('log', (x + dx, y + 0.32, Z), (x + dx, y, Z + 1.25), 0.05)
    cyl('log', (x - L / 2 - 0.1, y, Z + 1.22), (x + L / 2 + 0.1, y, Z + 1.22), 0.04)
    for i in range(6): xx = x - L / 2 + (i + 0.75) * L / 6.5; cyl('rope', (xx, y, Z + 1.2), (xx, y, Z + 1.0), 0.016); ball('fish', (xx, y, Z + 0.78), 0.075, (0.7, 0.5, 2.6))
def bench(x, y, L=1.5, rz=0.0):
    c, s = math.cos(rz), math.sin(rz)
    for d in (-L * 0.36, L * 0.36): cyl('log', (x + c * d, y + s * d, Z), (x + c * d, y + s * d, Z + 0.34), 0.11)
    box('deckl', (x, y, Z + 0.38), (L, 0.32, 0.08), rz=rz, bevel=0.15)
def planks_stack(x, y, L=2.2, rz=0.0, n=4, zb=None):
    zb = Z + 0.03 if zb is None else zb; c, s = math.cos(rz), math.sin(rz)
    for d in (-L * 0.35, L * 0.35): box('pile', (x + c * d, y + s * d, zb + 0.05), (0.14, 0.72, 0.1), rz=rz)
    for k in range(n):
        for j in range(3 - k // 2): box('fresh' if (j + k) % 3 else 'freshd', (x - s * (j - 1) * 0.22, y + c * (j - 1) * 0.22, zb + 0.13 + k * 0.07), (L * (1 - 0.05 * j), 0.2, 0.06), rz=rz + U(-0.015, 0.015), bevel=0.12)
def tar_pot(x, y, zb=None):
    zb = Z + 0.02 if zb is None else zb
    for a in (0.5, 2.6, 4.7): cyl('log', (x + math.cos(a) * 0.36, y + math.sin(a) * 0.36, zb), (x, y, zb + 0.95), 0.03)
    cyl('rope', (x, y, zb + 0.93), (x, y, zb + 0.62), 0.012); ball('tar', (x, y, zb + 0.46), 0.2, (1, 1, 0.8)); cyl('fresh', (x, y, zb + 0.6), (x + 0.22, y + 0.1, zb + 0.95), 0.015)
def work_float():                                          # the float beside the hull: six logs lashed under cross-poles, boards on top, a pot, a mallet
    S.decks.append((-1.2, 1.2, -0.7, 0.7))
    for i in range(6): y = -0.62 + i * 0.25; cyl('log', (-1.25 + U(-0.1, 0.1), y, 0.13), (1.25 + U(-0.1, 0.1), y, 0.13), 0.125); ball('logend', (1.26, y, 0.13), 0.1, (0.15, 1, 1))
    for x in (-0.9, 0.9): cyl('pile', (x, -0.78, 0.27), (x, 0.78, 0.27), 0.05)
    for i in range(4): box('deck' if i % 2 else 'deckd', (-0.15 + i * 0.3 - 0.3, 0, 0.32), (0.28, 1.25, 0.05), bevel=0.15)
    cyl('fresh', (-0.9, 0.6, 0.32), (-0.9, 0.6, 1.6), 0.04); ball('tar', (0.55, -0.25, 0.46), 0.16, (1, 1, 0.8)); coil_at = (0.6, 0.35); cyl('rope', (coil_at[0], coil_at[1], 0.3), (coil_at[0], coil_at[1], 0.42), 0.17, seg=12)
def net(side):                                             # a scrambling net over the pier's edge, one tile wide: from the kerb down the side and out on the water, where its foot floats, so it reads on any side
    w = TILE * 0.95; s = {'n': (0, 1), 's': (0, -1), 'e': (1, 0), 'w': (-1, 0)}[side]; ax = (s[1], s[0])
    def P(t, k):                                           # t across the net, k down it: 0 at the kerb, 1 at the water's edge of the side, 2 at the far float
        along = (t - 0.5) * w
        if k <= 1: o = 0.06 + 0.05 * k; z = Z + 0.12 - k * (Z + 0.1)
        else: o = 0.11 + (k - 1) * 1.15; z = 0.02
        return (ax[0] * along + s[0] * o, ax[1] * along + s[1] * o, z)
    C_, R_ = 5, 5
    for i in range(C_ + 1):
        for j in range(R_):
            k0, k1 = j / R_ * 2, (j + 1) / R_ * 2; cyl('rope', P(i / C_, k0), P(i / C_, k1), 0.03, seg=5)
    for j in range(R_ + 1):
        k = j / R_ * 2
        for i in range(C_): cyl('rope', P(i / C_, k), P((i + 1) / C_, k), 0.03, seg=5)
    for t in (0.0, 1.0): q = P(t, 0); cyl('pile', (q[0], q[1], Z), (q[0], q[1], Z + 0.5), 0.05); ball('pile', (q[0], q[1], Z + 0.5), 0.065, (1, 1, 0.6))
    for t in (0.1, 0.5, 0.9): q = P(t, 2); ball('horn', (q[0], q[1], 0.06), 0.09, (1.3, 1.3, 0.7))     # cork floats along its foot
def scene(name, fn, rz=0.0, keep=None):
    if ONLY and name not in ONLY: return
    sc, coll = fresh(); C.clear(); mats(); S.coll = coll; S.piles = []; S.decks = []
    rnd.seed(sum(map(ord, name))); fn()
    if keep:                                              # one side of the head's things: its objects kept by where they stand
        for o in list(coll.objects):
            cy = sum((o.matrix_world @ Vector(c)).y for c in o.bound_box) / 8
            if not keep(cy): bpy.data.objects.remove(o, do_unlink=True)
    root = bpy.data.objects.new('root', None); coll.objects.link(root)
    for o in list(coll.objects):
        if o is not root: o.parent = root
    root.rotation_euler = (0, 0, rz); bpy.context.view_layer.update()
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    xs, ups = [], []
    for o in coll.objects:
        if o.type != 'MESH': continue
        for cnr in o.bound_box: w = o.matrix_world @ Vector(cnr); xs.append(w.x); ups.append(w.y * math.sin(E) + w.z * math.cos(E))
    x0, x1, u0, u1 = min(xs) - 0.3, max(xs) + 0.3, min(ups) - 0.3, max(ups) + 0.3; vw = max(x1 - x0, u1 - u0)
    cam = toon.camera(sc, math.degrees(E), vw, 0.0); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 200; cam.location = (0, -60 * math.cos(E), 60 * math.sin(E))
    cam.data.shift_x = ((x0 + x1) / 2) / vw; cam.data.shift_y = ((u0 + u1) / 2) / vw
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = sc.render.resolution_y = int(round(vw * PPM * PX))
    fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(150); toon.piece_line(fs, at_colours=True)
    bpy.context.view_layer.update(); sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0))); co, si = math.cos(rz), math.sin(rz); T = lambda x, y: [round(x * co - y * si, 3), round(x * si + y * co, 3)]
    META[name] = {'size': sc.render.resolution_x, 'ax': round(a.x * sc.render.resolution_x, 1), 'ay': round((1 - a.y) * sc.render.resolution_y, 1), 'piles': [T(p[0], p[1]) + [p[2]] for p in S.piles], 'decks': [[T(d[0], d[2]), T(d[1], d[2]), T(d[1], d[3]), T(d[0], d[3])] for d in S.decks]}
    print('PIECE', name, sc.render.resolution_x)


meta_p = os.path.join(OUT, 'meta.json'); META = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
VARS = [None, 'knot', 'worn', 'patch', 'cleat']
for i, dt in enumerate(VARS):
    scene('deck_ew_%d' % (i + 1), (lambda i, dt: lambda: top(M, M, 'ew', 20 + i, dt))(i, dt)); scene('deck_ns_%d' % (i + 1), (lambda i, dt: lambda: top(M, M, 'ns', 30 + i, dt))(i, dt))
scene('kerb_n', lambda: kerb((-M / 2, M / 2), (M / 2, M / 2))); scene('kerb_s', lambda: kerb((-M / 2, -M / 2), (M / 2, -M / 2))); scene('kerb_e', lambda: kerb((M / 2, -M / 2), (M / 2, M / 2))); scene('kerb_w', lambda: kerb((-M / 2, -M / 2), (-M / 2, M / 2)))
scene('wall_m', lambda: wall(M)); scene('wall_h2', lambda: wall(H_L)); scene('wall_h3', lambda: wall(H_W))
for s in 'nesw': scene('landing_' + s, (lambda s: lambda: landing(s))(s)); scene('net_' + s, (lambda s: lambda: net(s))(s))
DS = (('e', (1, 0)), ('w', (-1, 0)), ('n', (0, 1)), ('s', (0, -1)))
for nm, d in DS:
    scene('head_' + nm, (lambda d: lambda: head_deck(d))(d))
    scene('things_%s_n' % nm, (lambda d: lambda: head_things(d))(d), keep=lambda cy: cy >= 0)
    scene('things_%s_s' % nm, (lambda d: lambda: head_things(d))(d), keep=lambda cy: cy < 0)
scene('mooring', lambda: mooring(0, 0)); scene('coil', lambda: coil(0, 0)); scene('barrels', lambda: (barrel(-0.25, 0.05), barrel(0.28, -0.1, 'tar', h=0.66, r=0.22)))
scene('fish_rack', lambda: fish_rack(0, 0, 1.3)); scene('bench', lambda: bench(0, 0, 1.4)); scene('float', work_float)
json.dump(META, open(meta_p, 'w'), indent=1)
if HB: json.dump({nm: HB[d] for nm, d in DS if d in HB}, open(os.path.join(OUT, 'blocks.json'), 'w'), indent=1)
print('PIECES done')
