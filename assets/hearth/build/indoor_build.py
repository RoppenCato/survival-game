"""The fires, as set pieces with a burning loop (2026-10-16; Robin, through the game's session: "We need to rework the fires.
They are static and look ugly. We need new models."). Five fires, each in three parts from one camera so they line up:

  base     the stones, the logs, the iron: one picture that never moves
  embers   the same base burned down: charred logs, ember red in grey-white ash (the game swaps it in for a dead fire)
  flames   the fire alone, a loop of FRAMES pictures at FPS: tongues that lick, lean and pulse, a small flame now and then
           breaking off the top and rising; whatever of the base stands in front of the fire cuts it (a holdout), so the game
           draws the base, then the flames over it, or not

  campfire     a ring of field stones with split logs crossed in it, about 1 m across: the first fire, on the starter island
  hearth       an open hearth of flat stones laid in a rounded square, tidier, about 1.3 m, an iron tripod over it with a pot
               hanging from it (as the game's drawn hearth has, where food is cooked): outdoors and in the village houses
  fireplace    a hearth built against a stone back with a mouth and a chimney stub going up (the game draws the chimney's top
               and its smoke over the roof): set against a north wall indoors. The back is built of its stones, courses of dressed
               blocks running back into a dark mortar core (2026-10-17: the first had round stones stuck on a grey box, which
               looked glued on and hovering)
  brazier      a forged fire basket about 1 m tall: three legs from curled feet pinching in and going on up as the ribs of an
               open cage that flares to a wide rim, every rib curled out at the top, split wood standing up in it (2026-10-17: the
               first, a bowl of hoops on three thin legs, looked like a barbecue grill)
  firepit      the village's big fire: a wide ring of heavy stones about 1.8 m across, logs heaped, a spit on two forked posts

The camera is the set pieces' (35 degrees above the ground, looking north), at the hero's pixels a metre: 4 px a game unit
when packed (a metre is 21.67 units; the drawn props bake at 2, which made the line twice as heavy), rendered at twice that. The flames are flat colour (an emission, no shading: the game lays the
light), three nested layers, outer red, orange, a yellow heart, with a thin ember-brown line instead of the ink.
   node tools/blender.js fires_build.py -- <fire|all> <out dir>
Writes <fire>_base.png, <fire>_embers.png, <fire>_flames_NN.png and meta.json (the origin's pixel, the pixels a metre, the frames)."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from skin import ball
from mathutils import Vector, Matrix, noise
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
WHICH = argv[0] if argv else 'all'; OUT = os.path.abspath(argv[1] if len(argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'render'))
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2; FRAMES = 10; FPS = 12      # 4 px a game unit when packed (the hero's density; the line weighs what his does), rendered at twice that
rad = math.radians; TAU = 2 * math.pi
FIRES = ['a_long', 'a_small', 'b_long', 'b_small', 'c_long', 'c_small', 'ljori']
ELEV = math.degrees(math.asin(0.75))

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    G = {'sc': sc, 'vl': bpy.context.view_layer}
    for n in ('Base', 'Logs', 'Embers', 'Flames'): G[n] = bpy.data.collections.new(n); sc.collection.children.link(G[n])
    G['M'] = {}
    return G
def mat(G, k, hexs):
    if k not in G['M']: G['M'][k] = toon.material('f_' + k, hexs, None, 'cel')
    return G['M'][k]
def flat(G, k, hexs):
    """an unshaded flat colour (an emission): the flames and the embers' glow, which the sun must not shade"""
    if k in G['M']: return G['M'][k]
    m = bpy.data.materials.new('f_' + k); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = toon.srgb(hexs) + (1.0,) if len(toon.srgb(hexs)) == 3 else toon.srgb(hexs); e.inputs[1].default_value = 1.0
    nt.links.new(e.outputs[0], o.inputs[0]); G['M'][k] = m; return m
def link(G, o, coll='Base'): G[coll].objects.link(o); return o
def mesh_obj(G, name, bm, mats, coll='Base', smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    return link(G, bpy.data.objects.new(name, me), coll)

# ---------------------------------------------------------------- parts
def rock(G, name, mk, c, r, sx=1.0, sy=1.0, sz=1.0, seed=0, amp=0.18, freq=1.6, flat_=0.55, seg=10, rings=7, coll='Base'):
    """a field stone: a low sphere pushed in and out by noise, its underside flattened, flat-shaded so the cel draws its facets"""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0); off = Vector((seed * 7.3, seed * 3.1, seed * 5.7))
    for v in bm.verts:
        u = v.co.copy(); d = 1 + amp * noise.noise(u * freq + off) + amp * 0.5 * noise.noise(u * freq * 2.3 + off * 2)
        v.co = Vector((u.x * sx, u.y * sy, max(u.z, -flat_) * sz)) * r * d + Vector(c)
    return mesh_obj(G, name, bm, [mk], coll)
def log(G, name, p0, p1, r, bark, end, split=None, seg=9, coll='Logs'):
    """a log from p0 to p1: bark round it, the cut ends pale; split: the log halved along its length, the split face (a third
    material) turned to that side (a vector), as split firewood is"""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r * 0.95, depth=L)
    for f in bm.faces: f.material_index = 1 if abs(f.normal.z) > 0.9 else 0
    if split is not None:
        res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector((0, 0, 0)), plane_no=Vector((1, 0, 0)), clear_inner=True)
        cut = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
        if cut:
            fl = bmesh.ops.edgeloop_fill(bm, edges=cut)
            for f in fl['faces']: f.material_index = 2
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix()
    if split is not None:                                       # turn the split face toward the side asked
        sx = rot @ Vector((-1, 0, 0)); want = Vector(split) - d.normalized() * Vector(split).dot(d.normalized())
        if want.length > 1e-4: rot = Matrix.Rotation(sx.angle(want.normalized()) * (1 if d.normalized().dot(sx.cross(want)) > 0 else -1), 3, d.normalized()) @ rot
    bmesh.ops.transform(bm, matrix=Matrix.Translation(p0 + d / 2) @ rot.to_4x4(), verts=bm.verts)
    return mesh_obj(G, name, bm, [bark, end] + ([split_mat(G)] if split is not None else []), coll)
def split_mat(G): return mat(G, 'split', '#b08a5c')
def tube_ring(G, name, mk, c, R, r, z, seg=24, coll='Base'):
    """an iron hoop: a thin tube round a circle of radius R at height z"""
    bm = bmesh.new(); rings = []
    for i in range(seg):
        a = TAU * i / seg; ctr = Vector((c[0] + math.cos(a) * R, c[1] + math.sin(a) * R, z)); t = Vector((-math.sin(a), math.cos(a), 0)); n1 = Vector((math.cos(a), math.sin(a), 0)); n2 = Vector((0, 0, 1))
        rings.append([bm.verts.new(ctr + (n1 * math.cos(TAU * k / 6) + n2 * math.sin(TAU * k / 6)) * r) for k in range(6)])
    for i in range(seg):
        a, b = rings[i], rings[(i + 1) % seg]
        for k in range(6): bm.faces.new((a[k], a[(k + 1) % 6], b[(k + 1) % 6], b[k]))
    return mesh_obj(G, name, bm, [mk], coll, smooth=True)
def rod(G, name, mk, pts, r, seg=6, coll='Base'):
    """a bar along points (iron straps, legs, the spit, posts): a chain of cylinders, each a little thicker than the joint"""
    objs = []
    for i in range(len(pts) - 1):
        p0, p1 = Vector(pts[i]), Vector(pts[i + 1]); d = p1 - p0
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=d.length + r)
        bmesh.ops.transform(bm, matrix=Matrix.Translation(p0 + d / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4(), verts=bm.verts)
        objs.append(mesh_obj(G, name, bm, [mk], coll))
    return objs
def disc(G, name, mk, c, rx, ry, z, seg=28, jag=0.0, seed=0, coll='Base'):
    """a flat patch on the ground (the ash bed, the scorched earth), its rim a little ragged"""
    rng = random.Random(seed); bm = bmesh.new(); vs = []
    for i in range(seg):
        a = TAU * i / seg; k = 1 + jag * (rng.random() - 0.5); vs.append(bm.verts.new((c[0] + math.cos(a) * rx * k, c[1] + math.sin(a) * ry * k, z)))
    bm.faces.new(vs); return mesh_obj(G, name, bm, [mk], coll)
def ring_of_stones(G, R, n, size, seed, mats_, ry=None, z=0.0, jit=0.12, sz=0.7, prefix='stone'):
    rng = random.Random(seed); ry = ry or R
    for i in range(n):
        a = TAU * (i + rng.uniform(-jit, jit)) / n; s = size * rng.uniform(0.82, 1.18)
        rock(G, '%s%d' % (prefix, i), mats_[i % len(mats_)], (math.cos(a) * R, math.sin(a) * ry, z + s * 0.25), s, rng.uniform(1.0, 1.4), rng.uniform(0.8, 1.1), sz * rng.uniform(0.85, 1.15), seed=seed * 13 + i, amp=0.22)
def embers(G, pts, seed, size=0.035, bed=None):
    """the embers state's glow: small flattened flecks of ember red and amber on the ash and the charred logs (flat colour); bed:
    (x, y, z, rx, ry) a glowing patch in the ash under the logs, dark red with a red heart"""
    rng = random.Random(seed)
    if bed:
        x, y, z, rx, ry = bed; disc(G, 'emberbed', flat(G, 'emberbed', '#8a2a1a'), (x, y), rx, ry, z, jag=0.35, seed=seed, coll='Embers'); disc(G, 'emberheart', flat(G, 'ember', '#d8452a'), (x, y), rx * 0.55, ry * 0.5, z + 0.002, jag=0.4, seed=seed + 1, coll='Embers')
    for i, p in enumerate(pts):
        m = flat(G, 'ember', '#d8452a') if i % 3 else flat(G, 'ember2', '#f39a3c')
        o = ball(G['Embers'] and 'ember%d' % i, G['Embers'], m, Vector(p), size * rng.uniform(0.6, 1.3), 1.3, 1.0, 0.45)

# ---------------------------------------------------------------- the flames
def tongue(G, name, base, h, w, lean, wig, phi, m, depth=0.75, coll='Flames', seg=10, N=11):
    """one tongue of flame: a teardrop drawn up from base, widest a fifth of the way up, drawn to a point, its middle swaying
    (wig) and its tip leaning (lean: x and y); a flat colour"""
    bm = bmesh.new(); R = []
    for k in range(N):
        t = k / (N - 1); ctr = Vector(base) + Vector((lean[0] * h * t ** 1.6 + wig * w * math.sin(TAU * t * 0.9 + phi) * t, lean[1] * h * t ** 1.6, h * t))
        r = w * (1 - t) ** 0.65 * (0.55 + 0.45 * min(1.0, t * 3.0))
        if k == N - 1: R.append([bm.verts.new(ctr)]); continue
        R.append([bm.verts.new(ctr + Vector((math.cos(TAU * i / seg) * r, math.sin(TAU * i / seg) * r * depth, 0))) for i in range(seg)])
    for k in range(N - 2):
        a, b = R[k], R[k + 1]
        for i in range(seg): bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    a, tip = R[N - 2], R[N - 1][0]
    for i in range(seg): bm.faces.new((a[i], a[(i + 1) % seg], tip))
    bm.faces.new(R[0][::-1]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(G, name, bm, [m], coll, smooth=True)
def flames(G, spec, p):
    """the fire at phase p (0..1, looping): spec is a list of tongues (x, y, z, height, width, lean x, lean y, phase offset); each
    is drawn three times, outer red, orange and a yellow heart, the inner ones smaller, lower and brought toward the camera so
    they show in front; heights pulse and the tips lean and sway on whole numbers of cycles a loop, so the loop closes; every
    other tongue throws a small flame off its top that rises and goes out"""
    for o in list(G['Flames'].objects): bpy.data.objects.remove(o)
    E = rad(ELEV); TO_CAM = Vector((0, -math.cos(E), math.sin(E)))
    LAY = [('flame_out', '#d8452a', 1.0, 1.0, 0.0), ('flame_mid', '#f08a2e', 0.74, 0.8, 0.05), ('flame_core', '#fcd45c', 0.46, 0.58, 0.10)]
    for i, (x, y, z, h, w, lx, ly, o) in enumerate(spec):
        s1 = math.sin(TAU * (p + o)); s2 = math.sin(TAU * (2 * p + o * 1.7)); s3 = math.sin(TAU * (3 * p + o * 2.3))
        hh = h * (1 + 0.16 * s1 + 0.07 * s3); lean = (lx + 0.14 * s2, ly + 0.05 * s1); wig = 0.35 * s2; phi = TAU * (p * 2 + o)
        for li, (nm, col, kh, kw, toward) in enumerate(LAY):
            tongue(G, '%s%d' % (nm, i), Vector((x, y, z)) + TO_CAM * (toward * w * 3 + 0.004 * li), hh * kh * (1 + 0.05 * s3 * li), w * kw, (lean[0] * (1 - 0.15 * li), lean[1]), wig * (1 - 0.2 * li), phi + li * 0.4, flat(G, nm, col))
        if i % 2 == 0:                                          # a small flame breaking off the tip and rising
            q = (p * 1 + o * 3.1) % 1.0
            if q < 0.8:
                tip = Vector((x + lean[0] * h, y + lean[1] * h, z + hh * 0.92)); c = tip + Vector((lean[0] * 0.3 * h * q, 0, h * 0.42 * q)); sz_ = w * 0.42 * (1 - q / 0.8) ** 0.7
                if sz_ > w * 0.06: tongue(G, 'lick%d' % i, c, sz_ * 3.2, sz_, (lean[0] * 0.5, 0), 0.0, 0.0, flat(G, 'flame_mid' if q < 0.4 else 'flame_out', '#f08a2e' if q < 0.4 else '#d8452a'))

# ---------------------------------------------------------------- the five fires
STONE = ('#8e887a', '#7d786e', '#9a9384')
def wood(G): return mat(G, 'bark', '#5e4532'), mat(G, 'end', '#b08a5a')
def ash(G, rx, ry, seed, z=0.004, scorch=1.25):
    disc(G, 'scorch', mat(G, 'scorch', '#4a443c'), (0, 0), rx * scorch, ry * scorch, 0.002, jag=0.25, seed=seed)
    disc(G, 'ash', mat(G, 'ash', '#6e6862'), (0, 0), rx, ry, z, jag=0.18, seed=seed + 1)
    rng = random.Random(seed)
    for i in range(5): a = rng.uniform(0, TAU); rr = rng.uniform(0.2, 0.75); disc(G, 'ashpale%d' % i, mat(G, 'ashpale', '#8e8880'), (math.cos(a) * rx * rr, math.sin(a) * ry * rr), rx * 0.18, ry * 0.12, z + 0.002, seg=10, jag=0.4, seed=seed + 5 + i)
def charcoal_lumps(G, R, n, seed, z=0.01):
    rng = random.Random(seed)
    for i in range(n): a = rng.uniform(0, TAU); rr = R * math.sqrt(rng.random()); rock(G, 'coal%d' % i, mat(G, 'coal', '#2c2622'), (math.cos(a) * rr, math.sin(a) * rr, z), rng.uniform(0.025, 0.05), 1.3, 1.0, 0.6, seed=seed + i, amp=0.3, coll='Logs')

def campfire(G):
    bark, end = wood(G); sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]
    ash(G, 0.36, 0.34, 3); ring_of_stones(G, 0.46, 10, 0.12, 4, sm)
    for i, (a, tilt, sp) in enumerate([(rad(20), 0.10, (0, 0, 1)), (rad(110), 0.13, (0.3, -1, 0.4)), (rad(-35), 0.16, (-1, -0.2, 0.5)), (rad(70), 0.2, (1, 0, 0.3))]):
        d = Vector((math.cos(a), math.sin(a), 0)); log(G, 'log%d' % i, -d * 0.32 + Vector((0, 0, 0.04)), d * 0.30 + Vector((0, 0, 0.04 + tilt)), 0.045, bark, end, split=sp)
    charcoal_lumps(G, 0.22, 7, 11)
    return dict(view=(1.3, 1.25), aim=0.32, spec=[(0.0, 0.0, 0.10, 0.52, 0.09, 0.05, 0.0, 0.0), (-0.12, 0.04, 0.08, 0.38, 0.07, -0.18, 0.0, 0.31), (0.12, -0.02, 0.08, 0.42, 0.075, 0.2, 0.02, 0.57),
                                                       (0.04, 0.10, 0.08, 0.34, 0.065, 0.05, 0.1, 0.78), (-0.05, -0.09, 0.07, 0.30, 0.06, -0.06, -0.05, 0.13)],
                bed=(0.0, 0.0, 0.008, 0.2, 0.17), ember_pts=[(0.05, 0.02, 0.06), (-0.1, 0.05, 0.05), (0.13, -0.04, 0.06), (0.0, -0.1, 0.03), (-0.15, -0.08, 0.02), (0.18, 0.1, 0.02), (-0.03, 0.15, 0.03), (0.09, 0.12, 0.08), (-0.2, 0.02, 0.03)])
def hearth(G):
    bark, end = wood(G); sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]
    ash(G, 0.42, 0.40, 21)
    rng = random.Random(22); n = 14
    for i in range(n):                                          # flat stones laid in a rounded square, edge to edge, two of each side a little taller
        a = TAU * i / n; sq = 1 / max(abs(math.cos(a)), abs(math.sin(a))) ** 0.55; R = 0.56 * sq
        rock(G, 'slab%d' % i, sm[i % 3], (math.cos(a) * R, math.sin(a) * R * 0.95, 0.04), 0.13 * rng.uniform(0.9, 1.1), 1.45, 1.1, 0.45, seed=200 + i, amp=0.12)
    for i, (a, tilt) in enumerate([(rad(5), 0.06), (rad(50), 0.1), (rad(-62), 0.12)]):
        d = Vector((math.cos(a), math.sin(a), 0)); log(G, 'log%d' % i, -d * 0.28 + Vector((0, 0, 0.04)), d * 0.26 + Vector((0, 0, 0.04 + tilt)), 0.042, bark, end, split=(0, -1, 0.5) if i != 1 else None)
    charcoal_lumps(G, 0.26, 8, 23)
    # the iron tripod over it with the pot hanging from a hook (the game's drawn hearth has one: it is where food is cooked)
    iron = mat(G, 'iron', '#4c5157'); apex = Vector((0, 0.02, 1.08))
    for i in range(3):
        a = TAU * i / 3 + rad(90); foot = Vector((math.cos(a) * 0.5, math.sin(a) * 0.48, 0.0)); rod(G, 'tripod%d' % i, iron, [foot, apex + (foot - apex) * 0.02, apex], 0.016)
    rod(G, 'hook', iron, [apex, apex + Vector((0, 0, -0.38)), apex + Vector((0, 0, -0.46))], 0.008)
    pot = Vector((0, 0.02, 0.52)); ball('pot', G['Base'], mat(G, 'pot', '#3e4247'), pot, 0.17, 1.0, 1.0, 0.82)
    tube_ring(G, 'potrim', iron, (pot.x, pot.y), 0.15, 0.016, pot.z + 0.12); rod(G, 'bail', iron, [pot + Vector((-0.15, 0, 0.12)), pot + Vector((-0.06, 0, 0.2)), apex + Vector((0, 0, -0.46)), pot + Vector((0.06, 0, 0.2)), pot + Vector((0.15, 0, 0.12))], 0.006)
    return dict(view=(1.6, 1.75), aim=0.5, spec=[(0.0, 0.0, 0.09, 0.40, 0.09, 0.03, 0.0, 0.0), (-0.13, 0.02, 0.08, 0.32, 0.07, -0.18, 0.0, 0.41), (0.13, 0.0, 0.08, 0.33, 0.072, 0.19, 0.0, 0.63), (0.02, 0.1, 0.07, 0.28, 0.06, 0.02, 0.08, 0.22)],
                bed=(0.0, 0.0, 0.008, 0.22, 0.2), ember_pts=[(0.04, 0.0, 0.06), (-0.12, 0.04, 0.05), (0.14, -0.03, 0.05), (0.0, -0.12, 0.02), (-0.18, -0.1, 0.02), (0.2, 0.12, 0.02), (0.06, 0.16, 0.03), (-0.06, 0.08, 0.07)])
def block(G, name, mk, x0, x1, y0, y1, z0, z1, seed, jit=0.014, coll='Base'):
    """a dressed field stone: a box with its corners pushed a little this way and that, flat-shaded, its square edges inked"""
    rng = random.Random(seed); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) @ Matrix.Diagonal((x1 - x0, y1 - y0, z1 - z0, 1)), verts=bm.verts)
    for v in bm.verts: v.co += Vector((rng.uniform(-jit, jit), rng.uniform(-jit, jit) * 0.4, rng.uniform(-jit, jit) * 0.7))
    return mesh_obj(G, name, bm, [mk], coll)
def masonry(G, x0, x1, front, depth, z0, z1, seed, sm, hole=None, wmin=0.18, wmax=0.33, prefix='blk'):
    """a stone wall built of its stones: courses of dressed blocks, each its own width, height and tone, running the wall's full
    depth back into a mortar core so nothing sits on it; the joints between them are the core showing, dark; hole: (x0, x1, z1) an
    opening the courses stop at, from the ground up to z1"""
    rng = random.Random(seed); z = z0; ri = 0; G_ = 0.014
    while z < z1 - 0.03:
        rh = min(rng.uniform(0.15, 0.21), z1 - z); x = x0 + (rng.uniform(0.05, 0.14) if ri % 2 else 0.0)
        if z1 - (z + rh) < 0.08: rh = z1 - z                    # the last course takes what is left
        top = z + rh >= z1 - 0.001; dk = (lambda: 1.0) if top else (lambda: rng.uniform(0.6, 0.95))   # the top course runs the full depth: capstones over the core
        if x > x0 + 0.03: block(G, '%s%d_s' % (prefix, ri), sm[rng.randrange(3)], x0, x - G_, front - rng.uniform(0.0, 0.012), front + depth * dk(), z, z + rh - (0 if top else G_), seed + ri * 31)
        while x < x1 - 0.03:
            bw = rng.uniform(wmin, wmax); xe = min(x + bw, x1)
            if x1 - xe < 0.09: xe = x1                             # no sliver at the end of a course
            bx0, bx1 = x, xe - (G_ if xe < x1 else 0)
            parts = [(bx0, bx1)]
            if hole and z < hole[2] - 0.01:                        # cut the course at the opening
                parts = [(u, min(v, hole[0])) for (u, v) in parts if u < hole[0]] + [(max(u, hole[1]), v) for (u, v) in parts if v > hole[1]]
            for k, (u, v) in enumerate(parts):
                if v - u > 0.035: block(G, '%s%d_%d_%d' % (prefix, ri, int(x * 100), k), sm[rng.randrange(3)], u, v, front - rng.uniform(0.0, 0.014), front + depth * dk(), z, z + rh - (0 if top else G_), seed + ri * 31 + int(x * 70) + k)
            x = xe
        z += rh; ri += 1
def fireplace(G):
    bark, end = wood(G); sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]; mortar = mat(G, 'mortar', '#4c463e'); soot = mat(G, 'soot', '#231c19')
    W, D, H, Y0 = 1.3, 0.5, 1.15, 0.12                         # the stone back: width, depth, height; its front face at y = Y0 - D / 2
    CW, CD, CH = 0.62, 0.42, 1.95                               # the chimney stub going up from the back
    front = Y0 - D / 2; MW, MH, FD = 0.72, 0.6, 0.32             # the mouth: width, height, and how deep the firebox goes into the back
    def box(name, x0, x1, y0, y1, z0, z1, m):
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.transform(bm, matrix=Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) @ Matrix.Diagonal((x1 - x0, y1 - y0, z1 - z0, 1)), verts=bm.verts); return mesh_obj(G, name, bm, [m])
    I = 0.012                                                    # the mortar core, a little inside the stones' faces, round the opening
    box('coreL', -W / 2 + I, -MW / 2, front + I, Y0 + D / 2 - I, 0, H - I, mortar); box('coreR', MW / 2, W / 2 - I, front + I, Y0 + D / 2 - I, 0, H - I, mortar)
    box('coreTop', -MW / 2, MW / 2, front + I, Y0 + D / 2 - I, MH, H - I, mortar); box('coreRear', -MW / 2, MW / 2, front + FD, Y0 + D / 2 - I, 0, MH, mortar)
    cf = Y0 + 0.05 - CD / 2; box('coreChimney', -CW / 2 + I, CW / 2 - I, cf + I, cf + CD - I, H - 0.05, CH - I, mortar)
    box('fireboxBack', -MW / 2 + 0.01, MW / 2 - 0.01, front + FD - 0.01, front + FD, 0.0, MH, soot)                                     # the firebox, black with soot
    box('fireboxL', -MW / 2, -MW / 2 + 0.012, front, front + FD, 0.0, MH, soot); box('fireboxR', MW / 2 - 0.012, MW / 2, front, front + FD, 0.0, MH, soot)
    box('fireboxTop', -MW / 2, MW / 2, front, front + FD, MH - 0.01, MH, soot); box('fireboxFloor', -MW / 2, MW / 2, front, front + FD, 0.0, 0.012, mat(G, 'ashfloor', '#4a443c'))
    masonry(G, -W / 2, W / 2, front, D, 0.0, MH, 31, sm, hole=(-MW / 2, MW / 2, MH), prefix='low')                                  # the courses beside the mouth
    block(G, 'lintel', mat(G, 'lintel', '#958e80'), -MW / 2 - 0.13, MW / 2 + 0.13, front - 0.02, front + D * 0.8, MH, MH + 0.17, 377, jit=0.01)   # one long stone over the mouth
    masonry(G, -W / 2, -MW / 2 - 0.13 - 0.014, front, D, MH, MH + 0.17, 41, sm, wmin=0.12, wmax=0.2, prefix='lsl'); masonry(G, MW / 2 + 0.13 + 0.014, W / 2, front, D, MH, MH + 0.17, 43, sm, wmin=0.12, wmax=0.2, prefix='lsr')
    masonry(G, -W / 2, W / 2, front, D, MH + 0.17 + 0.014, H, 51, sm, prefix='up')                                                    # the courses above it to the top of the back
    masonry(G, -CW / 2, CW / 2, cf, CD, H, CH, 61, sm, wmin=0.14, wmax=0.26, prefix='chim')                                           # the chimney stub
    for i, (x0, x1) in enumerate(((-0.62, -0.2), (-0.186, 0.2), (0.214, 0.62))): block(G, 'hearthslab%d' % i, sm[(i + 1) % 3], x0, x1, front - 0.34, front - 0.01, 0.0, 0.045, 390 + i, jit=0.01)   # the hearth slabs in front
    disc(G, 'ash', mat(G, 'ash', '#6e6862'), (0, front + 0.16), 0.3, 0.12, 0.014, jag=0.2, seed=33)
    for i, (a, tilt) in enumerate([(rad(8), 0.06), (rad(-12), 0.1)]):
        d = Vector((math.cos(a), math.sin(a) * 0.3, 0)); log(G, 'log%d' % i, -d * 0.26 + Vector((0, front + 0.16, 0.035)), d * 0.24 + Vector((0, front + 0.16, 0.035 + tilt)), 0.04, bark, end, split=(0, -1, 0.4) if i == 0 else None)
    return dict(view=(1.7, 2.45), aim=0.95, spec=[(0.0, front + 0.15, 0.08, 0.42, 0.08, 0.02, 0.02, 0.0), (-0.13, front + 0.17, 0.07, 0.30, 0.065, -0.1, 0.02, 0.37), (0.14, front + 0.16, 0.07, 0.32, 0.066, 0.1, 0.02, 0.66)],
                bed=(0.0, front + 0.16, 0.018, 0.22, 0.09), ember_pts=[(0.03, front + 0.15, 0.05), (-0.1, front + 0.15, 0.05), (0.12, front + 0.16, 0.06), (0.0, front + 0.1, 0.02), (-0.2, front + 0.12, 0.02), (0.2, front + 0.12, 0.02)])
def brazier(G):
    """a forged fire basket (2026-10-17; Robin: the first looked like a barbecue grill): three legs that rise from curled feet,
    pinch in at a waist and go on up as the basket's ribs, flaring out to a wide open rim, three more ribs between them, every
    rib ending in a scroll curled outward above the rim; two hoops binding it; an open cage, so the fire shows through it; split
    wood standing up in it like a little tepee, its ends above the rim"""
    iron = mat(G, 'iron', '#4c5157'); bark, end = wood(G)
    ZW, RW = 0.46, 0.12                                          # the waist (the basket's floor) and its radius
    ZR, RR = 0.97, 0.3                                           # the rim
    up = Vector((0, 0, 1))
    def rib(a, leg):
        d = Vector((math.cos(a), math.sin(a), 0)); pts = []
        if leg: pts += [d * 0.34 + up * 0.055, d * 0.37 + up * 0.03, d * 0.35 + up * 0.012, d * 0.31 + up * 0.02, d * 0.24 + up * 0.17, d * 0.16 + up * 0.34]   # the curled foot, the leg rising in
        pts += [d * RW + up * ZW, d * 0.17 + up * 0.62, d * 0.235 + up * 0.8, d * RR + up * ZR]                                                                   # the rib flaring out
        pts += [d * (RR + 0.035) + up * (ZR + 0.05), d * (RR + 0.08) + up * (ZR + 0.06), d * (RR + 0.1) + up * (ZR + 0.03), d * (RR + 0.085) + up * (ZR + 0.005)]   # the scroll
        rod(G, ('leg%d' if leg else 'rib%d') % int(a * 100), iron, pts, 0.017 if leg else 0.013)
    for i in range(6): rib(TAU * i / 6 + rad(90), i % 2 == 0)
    tube_ring(G, 'waist', iron, (0, 0), RW, 0.016, ZW); tube_ring(G, 'hoop', iron, (0, 0), 0.205, 0.013, 0.72); tube_ring(G, 'rim', iron, (0, 0), RR, 0.015, ZR)
    for k in range(2): rod(G, 'grate%d' % k, iron, [Vector((math.cos(rad(90 + 90 * k)), math.sin(rad(90 + 90 * k)), 0)) * RW * s_ + up * (ZW + 0.005) for s_ in (-1, 1)], 0.01)   # a cross of bars for a floor
    rng = random.Random(41)
    for i in range(10): a = rng.uniform(0, TAU); rr = 0.1 * math.sqrt(rng.random()); rock(G, 'coal%d' % i, mat(G, 'coal', '#2c2622'), (math.cos(a) * rr, math.sin(a) * rr, ZW + 0.03 + 0.03 * (1 - rr / 0.1)), rng.uniform(0.035, 0.05), 1.2, 1.0, 0.8, seed=410 + i, amp=0.3, coll='Logs')
    for i in range(5):                                           # the split wood standing up in it, leaning out against the ribs
        a = TAU * i / 5 + 0.3; d = Vector((math.cos(a), math.sin(a), 0)); log(G, 'stick%d' % i, d * 0.03 + up * (ZW + 0.03), d * 0.2 + up * (ZR + 0.07 + 0.03 * math.sin(i * 2.1)), 0.026, bark, end, split=-d if i % 2 else None)
    return dict(view=(1.1, 2.0), aim=0.72, spec=[(0.0, 0.0, ZW + 0.05, 0.66, 0.085, 0.02, 0.0, 0.0), (-0.07, 0.03, ZW + 0.05, 0.52, 0.07, -0.12, 0.0, 0.43), (0.08, -0.02, ZW + 0.05, 0.55, 0.07, 0.13, 0.0, 0.71), (0.0, 0.06, ZW + 0.04, 0.46, 0.06, 0.0, 0.08, 0.2)],
                bed=(0.0, 0.0, ZW + 0.02, 0.1, 0.09), ember_pts=[(0.02, 0.0, ZW + 0.07), (-0.06, 0.04, ZW + 0.05), (0.06, -0.04, ZW + 0.06), (0.03, 0.07, ZW + 0.05), (-0.04, -0.06, ZW + 0.05), (0.08, 0.05, ZW + 0.04)])
def firepit(G):
    bark, end = wood(G); sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]; post = mat(G, 'post', '#6b5038'); iron = mat(G, 'iron', '#4c5157')
    ash(G, 0.62, 0.58, 51, scorch=1.2); ring_of_stones(G, 0.86, 15, 0.19, 52, sm, sz=0.75)
    rng = random.Random(53)
    for i in range(6):                                          # a second course: a few stones laid on the first, toward the back
        a = TAU * (i + 0.5) / 15 * 2.5 + rad(40); rock(G, 'top%d' % i, sm[i % 3], (math.cos(a) * 0.86, math.sin(a) * 0.86, 0.2), 0.15, 1.2, 1.0, 0.6, seed=530 + i, amp=0.2)
    for i, (a, tilt, sp) in enumerate([(rad(15), 0.12, (0, -1, 0.5)), (rad(75), 0.2, None), (rad(130), 0.16, (-0.4, -1, 0.4)), (rad(-40), 0.22, (1, -0.5, 0.4)), (rad(-100), 0.1, None)]):
        d = Vector((math.cos(a), math.sin(a), 0)); log(G, 'log%d' % i, -d * 0.5 + Vector((0, 0, 0.05)), d * 0.46 + Vector((0, 0, 0.05 + tilt)), 0.06, bark, end, split=sp)
    charcoal_lumps(G, 0.42, 12, 54)
    for sx in (1, -1):                                          # the forked posts outside the ring, and the spit across them with a crank
        x = sx * 1.08; rod(G, 'post%d' % sx, post, [(x, 0.02, 0.0), (x, 0.0, 0.9)], 0.035, seg=7)
        rod(G, 'forkA%d' % sx, post, [(x, 0.0, 0.88), (x + 0.03, -0.09, 1.04)], 0.022); rod(G, 'forkB%d' % sx, post, [(x, 0.0, 0.88), (x - 0.02, 0.09, 1.03)], 0.022)
    rod(G, 'spit', iron, [(-1.22, -0.005, 0.965), (1.15, -0.005, 0.965)], 0.016); rod(G, 'crank', iron, [(-1.22, -0.005, 0.965), (-1.24, -0.005, 0.86), (-1.32, -0.005, 0.86)], 0.013)
    return dict(view=(2.75, 2.05), aim=0.42, spec=[(0.0, 0.0, 0.12, 0.85, 0.13, 0.03, 0.0, 0.0), (-0.22, 0.05, 0.1, 0.62, 0.1, -0.15, 0.0, 0.29), (0.22, -0.03, 0.1, 0.68, 0.105, 0.16, 0.0, 0.52),
                                                    (0.08, 0.2, 0.1, 0.55, 0.095, 0.05, 0.1, 0.76), (-0.1, -0.18, 0.09, 0.5, 0.09, -0.05, -0.05, 0.11), (0.32, 0.14, 0.09, 0.42, 0.08, 0.2, 0.05, 0.9), (-0.33, -0.08, 0.09, 0.4, 0.08, -0.2, 0.0, 0.66)],
                bed=(0.0, 0.0, 0.008, 0.4, 0.36), ember_pts=[(rng.uniform(-0.45, 0.45), rng.uniform(-0.4, 0.4), 0.03 + rng.uniform(0, 0.08)) for _ in range(16)])
# ---------------------------------------------------------------- the indoor fires, three drafts (Colin, AD, 2026-10-31; Robin: "You couldnt just have a normal fire like that indoors on the wooden floor.
# It needs to make sense."). All are drawn at the tilt that matches the ground, so a tile lies on the grid: the boards stop at a timber curb that sits on the grid. x east, y north, metres; a tile is TILE across.
TILE = 32 / UNIT
OAK = '#6e5138'; OAKTOP = '#8a6a48'
def curb(G, hx, hy, w=0.13, h=0.05, seed=1, name='curb'):
    """the timber curb where the floor's boards stop: four hewn beams on edge, the long ones running past the short at the corners, a peg in each lap; the outer edge is the footprint"""
    m = mat(G, 'curb', OAK); t = mat(G, 'curbtop', OAKTOP); pg = mat(G, 'peg', '#3e2c1e')
    block(G, name + 'S', t, -hx, hx, -hy, -hy + w, -0.02, h, seed, jit=0.006); block(G, name + 'N', t, -hx, hx, hy - w, hy, -0.02, h, seed + 1, jit=0.006)
    block(G, name + 'W', m, -hx, -hx + w, -hy + w, hy - w, -0.02, h * 0.8, seed + 2, jit=0.006); block(G, name + 'E', m, hx - w, hx, -hy + w, hy - w, -0.02, h * 0.8, seed + 3, jit=0.006)
    for sx in (-1, 1):
        for sy in (-1, 1): disc(G, 'peg', pg, (sx * (hx - w / 2), sy * (hy - w / 2)), 0.02, 0.02, h + 0.002, seg=8)
def kerb_stones(G, hx, hy, sm, seed, size=0.105, z=0.02, sz=0.42, prefix='kerb'):
    """flat stones laid edge to edge round the bed, inside the curb, in a rectangle"""
    rng = random.Random(seed); i = 0
    def along(x0, y0, x1, y1):
        nonlocal i
        L = math.hypot(x1 - x0, y1 - y0); n = max(2, int(round(L / (size * 2.3))))
        for k in range(n):
            t = (k + 0.5) / n; s = size * rng.uniform(0.92, 1.12); horiz = abs(x1 - x0) > abs(y1 - y0)
            rock(G, '%s%d' % (prefix, i), sm[rng.randrange(3)], (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z), s, 1.15 if horiz else 0.95, 0.95 if horiz else 1.15, sz, seed=seed * 3 + i, amp=0.1); i += 1
    along(-hx, -hy, hx, -hy); along(-hx, hy, hx, hy); along(-hx, -hy + size, -hx, hy - size); along(hx, -hy + size, hx, hy - size)
def plate(G, name, mk, hx, hy, z, seed, jag=0.018):
    """a flat bed of clay, a little uneven at the edge"""
    rng = random.Random(seed); bm = bmesh.new(); vs = []; n = 8; pts = []
    for i in range(n): pts.append((-hx + 2 * hx * i / n, -hy))
    for i in range(n): pts.append((hx, -hy + 2 * hy * i / n))
    for i in range(n): pts.append((hx - 2 * hx * i / n, hy))
    for i in range(n): pts.append((-hx, hy - 2 * hy * i / n))
    for p in pts: vs.append(bm.verts.new((p[0] + rng.uniform(-jag, jag), p[1] + rng.uniform(-jag, jag), z)))
    bm.faces.new(vs); return mesh_obj(G, name, bm, [mk])
def blaze(G, cx, cy, z, rx, ry, seed, tilt=0.08):
    """the fire proper: three split logs and coals, an ash patch under them"""
    bark, end = wood(G); rng = random.Random(seed)
    for i, (a, dz) in enumerate([(rad(8), tilt * 0.6), (rad(52), tilt), (rad(-58), tilt * 1.2)]):
        d = Vector((math.cos(a) * rx, math.sin(a) * ry, 0)); log(G, 'log%d_%d' % (seed, i), Vector((cx, cy, z + 0.04)) - d, Vector((cx, cy, z + 0.04 + dz)) + d, 0.042, bark, end, split=(0, -1, 0.5) if i != 1 else None)
    for i in range(7): a = rng.uniform(0, TAU); rr = rng.random() ** 0.5; rock(G, 'coal%d_%d' % (seed, i), mat(G, 'coal', '#2c2622'), (cx + math.cos(a) * rx * rr, cy + math.sin(a) * ry * rr, z + 0.012), rng.uniform(0.025, 0.05), 1.3, 1.0, 0.6, seed=seed + i, amp=0.3, coll='Logs')
def tongues_at(cx, cy, z, rx, ry, n, h, w, seed):
    rng = random.Random(seed); o = []
    for i in range(n):
        k = (i + 0.5) / n * 2 - 1; o.append((cx + k * rx, cy + rng.uniform(-ry, ry), z, h * (1 - 0.38 * abs(k)) * rng.uniform(0.88, 1.1), w * rng.uniform(0.85, 1.1), k * 0.2 + rng.uniform(-0.05, 0.05), rng.uniform(-0.03, 0.05), rng.random()))
    return o
def ember_list(cx, cy, z, rx, ry, n, seed):
    rng = random.Random(seed); return [(cx + rng.uniform(-rx, rx), cy + rng.uniform(-ry, ry), z + rng.uniform(0.01, 0.06)) for i in range(n)]
def stand_pot(G, x, y, z, r=0.15):
    """a low iron trivet with a pot on it, at the fire's edge: what a hearth is for"""
    iron = mat(G, 'iron', '#4c5157')
    for i in range(3): a = TAU * i / 3 + rad(90); rod(G, 'tri%d' % i, iron, [(x + math.cos(a) * r, y + math.sin(a) * r, z), (x + math.cos(a) * r * 0.8, y + math.sin(a) * r * 0.8, z + 0.14)], 0.012)
    tube_ring(G, 'triring', iron, (x, y), r * 0.82, 0.012, z + 0.14)
    ball('pot', G['Base'], mat(G, 'pot', '#3e4247'), Vector((x, y, z + 0.25)), r, 1.0, 1.0, 0.82); tube_ring(G, 'potrim', iron, (x, y), r * 0.86, 0.014, z + 0.25 + r * 0.72)
def chain(G, a, b, r=0.016):
    """a chain that reads at the game's size: fat links, one seen flat, the next edge on"""
    iron = mat(G, 'iron', '#4c5157'); a, b = Vector(a), Vector(b); L = (b - a).length; n = max(2, int(L / 0.1)); d = (b - a) / n
    for i in range(n):
        p = a + d * i; q = p + d
        if i % 2 == 0:
            s = Vector((r * 1.5, 0, 0)); rod(G, 'lk', iron, [p + d * 0.1, p + d * 0.3 + s, q - d * 0.3 + s, q + d * 0.1 - s * 0.0, q - d * 0.3 - s, p + d * 0.3 - s, p + d * 0.1], r * 0.62, seg=5)
        else: rod(G, 'lk', iron, [p, q], r * 0.85, seg=5)
def cauldron(G, x, y, z, r=0.25, hook=None):
    """the big iron kettle, a bail over it, hung from hook"""
    iron = mat(G, 'iron', '#4c5157'); ball('kettle', G['Base'], mat(G, 'pot', '#3e4247'), Vector((x, y, z)), r, 1.0, 1.0, 0.8); top = z + r * 0.62
    tube_ring(G, 'kettlerim', iron, (x, y), r * 0.86, 0.02, top); ap = Vector((x, y, top + r * 0.85))
    rod(G, 'bail', iron, [(x - r * 0.86, y, top), (x - r * 0.55, y, top + r * 0.55), ap, (x + r * 0.55, y, top + r * 0.55), (x + r * 0.86, y, top)], 0.011); return ap
def sill(G, name, x0, x1, y, z0, z1, wd=0.1, seed=1):
    """a hewn timber: a beam lying along x"""
    return block(G, name, mat(G, 'curbtop', OAKTOP), x0, x1, y - wd / 2, y + wd / 2, z0, z1, seed, jit=0.007)
def post(G, name, x, y, z1, wd=0.075, seed=1):
    return block(G, name, mat(G, 'curb', OAK), x - wd, x + wd, y - wd, y + wd, 0.0, z1, seed, jit=0.006)

def long_hearth(G, tx):
    """A. the long hearth (langeldr), set into the floor: the boards stop at a timber curb; inside it, flat stones on edge and a bed of baked clay a little lower than the floor. Burns in the middle, coals raked to each end"""
    sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]; hx = tx * TILE / 2 - 0.01; hy = TILE / 2 - 0.01
    curb(G, hx, hy, seed=3); ix, iy = hx - 0.13, hy - 0.13
    plate(G, 'clay', mat(G, 'clay', '#7e624c'), ix, iy, -0.05, 5); kerb_stones(G, ix - 0.08, iy - 0.08, sm, 7 + tx, size=0.095)
    burn = min(ix - 0.3, 0.42 if tx == 1 else 1.0)
    disc(G, 'scorch', mat(G, 'scorch', '#4a443c'), (0, 0), burn + 0.14, iy - 0.13, -0.046, jag=0.2, seed=8); disc(G, 'ash', mat(G, 'ash', '#6e6862'), (0, 0), burn, iy - 0.2, -0.042, jag=0.18, seed=9)
    if tx == 1:
        blaze(G, 0, 0.02, -0.04, 0.3, 0.24, 11); spec = tongues_at(0, 0.02, 0.02, 0.17, 0.08, 4, 0.5, 0.09, 12); ep = ember_list(0, 0, -0.04, 0.3, 0.26, 9, 13); bed = (0, 0, -0.04, 0.26, 0.24)
        return dict(view=(1.72, 1.95), aim=0.3, spec=spec, bed=bed, ember_pts=ep)
    n = max(2, tx - 1); xs = [(-burn + 2 * burn * (i + 0.5) / n) for i in range(n)]; spec = []; ep = []
    for i, x in enumerate(xs): blaze(G, x, 0.02, -0.04, 0.33, 0.24, 20 + i * 3); spec += tongues_at(x, 0.02, 0.02, 0.22, 0.08, 4, 0.56, 0.1, 30 + i); ep += ember_list(x, 0, -0.04, 0.34, 0.25, 8, 40 + i)
    for s in (-1, 1):                                            # the raked coals at each end, where the pots stand, and a pot on its trivet at the east end
        disc(G, 'rake%d' % s, mat(G, 'scorch', '#4a443c'), (s * (burn + (ix - burn) * 0.6), 0), (ix - burn) * 0.42, iy - 0.2, -0.044, jag=0.25, seed=50 + s); charcoal_lumps(G, 0.01, 0, 1)
    stand_pot(G, burn + (ix - burn) * 0.55, 0.02, -0.045, r=0.16)
    return dict(view=(tx * TILE + 0.3, 2.0), aim=0.3, spec=spec, bed=(0, 0, -0.04, burn, 0.24), ember_pts=ep)

def raised_box(G, tx):
    """B. the raised hearth: a low box of stone with a clay top, standing on a timber sill so it never touches the boards; you can sit on the edge. The fire stands knee high"""
    sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]; hx = tx * TILE / 2 - 0.03; hy = TILE / 2 - 0.03; Z = 0.42; X = hx - 0.12; Y = hy - 0.12
    curb(G, hx, hy, w=0.12, h=0.07, seed=4, name='sill')
    block(G, 'core', mat(G, 'mortar', '#3a342c'), -X + 0.01, X - 0.01, -Y + 0.015, Y, 0.05, Z - 0.02, 5, jit=0.0)
    masonry(G, -X, X, -Y, 0.14, 0.06, Z - 0.05, 60 + tx, sm, prefix='fb')
    clay = mat(G, 'clay2', '#a5876a'); block(G, 'rimS', clay, -X - 0.025, X + 0.025, -Y - 0.025, -Y + 0.15, Z - 0.05, Z + 0.015, 6, jit=0.006); block(G, 'rimN', clay, -X - 0.025, X + 0.025, Y - 0.15, Y + 0.02, Z - 0.05, Z + 0.015, 7, jit=0.006)
    block(G, 'rimW', clay, -X - 0.025, -X + 0.15, -Y + 0.15, Y - 0.15, Z - 0.05, Z + 0.012, 8, jit=0.006); block(G, 'rimE', clay, X - 0.15, X + 0.025, -Y + 0.15, Y - 0.15, Z - 0.05, Z + 0.012, 9, jit=0.006)
    plate(G, 'bed', mat(G, 'clay', '#7e624c'), X - 0.15, Y - 0.15, Z - 0.02, 10, jag=0.008); ix = X - 0.2; iy = Y - 0.2
    disc(G, 'ash', mat(G, 'ash', '#6e6862'), (0, 0), min(ix, 0.9), iy, Z - 0.015, jag=0.16, seed=12)
    rx = min(ix * 0.8, 0.28 if tx == 1 else 0.3)
    if tx == 1:
        blaze(G, 0, 0.0, Z - 0.01, rx, iy * 0.7, 14); spec = tongues_at(0, 0, Z + 0.03, rx * 0.65, 0.06, 4, 0.46, 0.085, 15); ep = ember_list(0, 0, Z, rx, iy * 0.7, 8, 16); bed = (0, 0, Z - 0.012, rx, iy * 0.75)
    else:
        blaze(G, -0.5, 0.0, Z - 0.01, 0.34, iy * 0.7, 14); blaze(G, 0.12, 0.0, Z - 0.01, 0.3, iy * 0.7, 17); spec = tongues_at(-0.5, 0, Z + 0.03, 0.22, 0.06, 4, 0.5, 0.09, 15) + tongues_at(0.12, 0, Z + 0.03, 0.2, 0.06, 3, 0.44, 0.085, 18)
        ep = ember_list(-0.2, 0, Z, 0.6, iy * 0.7, 12, 16); bed = (-0.2, 0, Z - 0.012, 0.62, iy * 0.75); stand_pot(G, X - 0.34, 0.0, Z - 0.005, r=0.15)
    return dict(view=(tx * TILE + 0.3, 2.3), aim=0.5, spec=spec, bed=bed, ember_pts=ep)

def hung_kettle(G, tx):
    """C. the hearth with what ties it to the roof: a stone hearth in a curb, as A, with the house's own timber standing over it, and the big kettle on a chain. Big: two posts and the tie-beam, left standing when the roof fades. Small: one post with an arm (a crane), which swings the kettle off the fire"""
    sm = [mat(G, 's%d' % i, c) for i, c in enumerate(STONE)]; hx = tx * TILE / 2 - 0.01; hy = TILE / 2 - 0.01
    curb(G, hx, hy, seed=5); ix, iy = hx - 0.13, hy - 0.13
    plate(G, 'clay', mat(G, 'clay', '#7e624c'), ix, iy, -0.05, 15); kerb_stones(G, ix - 0.08, iy - 0.08, sm, 17 + tx, size=0.095)
    if tx > 1:
        Bz = 2.42; P = hx - 0.075
        post(G, 'postW', -P, 0.0, Bz + 0.02, seed=21); post(G, 'postE', P, 0.0, Bz + 0.02, seed=22)
        sill(G, 'tiebeam', -P - 0.22, P + 0.22, 0.0, Bz, Bz + 0.15, wd=0.14, seed=23)
        for s in (-1, 1): rod(G, 'knee%d' % s, mat(G, 'curb', OAK), [(s * P, 0, Bz - 0.5), (s * (P - 0.42), 0, Bz + 0.01)], 0.045, seg=4)     # the braces
        cx = 0.0; Az = Bz
        disc(G, 'ash', mat(G, 'ash', '#6e6862'), (cx, 0), 0.55, iy - 0.18, -0.042, jag=0.18, seed=24)
    else:
        P = -hx + 0.075; Az = 2.05; cx = 0.0
        post(G, 'crane', P, hy - 0.075, Az + 0.14, seed=31); rod(G, 'arm', mat(G, 'curbtop', OAKTOP), [(P, hy - 0.075, Az), (0.06, 0.0, Az)], 0.05, seg=4)
        rod(G, 'brace', mat(G, 'curb', OAK), [(P, hy - 0.075, Az - 0.55), (P + 0.42, (hy - 0.075) * 0.55, Az - 0.01)], 0.038, seg=4)
        disc(G, 'ash', mat(G, 'ash', '#6e6862'), (cx, 0), 0.34, iy - 0.14, -0.042, jag=0.18, seed=24)
    blaze(G, cx, -0.02, -0.04, 0.31, 0.22, 25); spec = tongues_at(cx, 0.0, 0.02, 0.21, 0.06, 4, 0.42, 0.095, 26); ep = ember_list(cx, 0, -0.04, 0.3, 0.22, 9, 27)
    Kz = 0.64; R = 0.26 if tx > 1 else 0.21; ap = cauldron(G, cx, 0.0, Kz, r=R); chain(G, (cx, 0.0, Az), ap, r=0.018)
    return dict(view=(max(tx * TILE + 0.8, 2.3), 3.6), aim=1.05, spec=spec, bed=(cx, 0, -0.04, 0.3, 0.22), ember_pts=ep)

def smoke_hole(G):
    """the smoke hole in the ridge (ljóri) as you see it from outside: a timber frame set in the thatch with a small board roof on four stubs over it, open at the sides. The base is the frame; the flames slot is empty"""
    m = mat(G, 'curb', OAK); t = mat(G, 'curbtop', OAKTOP); dk = mat(G, 'mortar', '#221a14'); W, D, H = 0.55, 0.38, 0.0
    block(G, 'hole', dk, -W, W, -D, D, 0.0, 0.05, 1, jit=0.0)
    for nm, a in (('S', (-W - 0.08, W + 0.08, -D - 0.08, -D, 0.0, 0.14)), ('N', (-W - 0.08, W + 0.08, D, D + 0.08, 0.0, 0.14)), ('W', (-W - 0.08, -W, -D, D, 0.0, 0.14)), ('E', (W, W + 0.08, -D, D, 0.0, 0.14))): block(G, 'frame' + nm, t, *a, 40, jit=0.005)
    for sx in (-1, 1):
        for sy in (-1, 1): block(G, 'stub', m, sx * W - 0.035, sx * W + 0.035, sy * D - 0.035, sy * D + 0.035, 0.1, 0.42, 41, jit=0.004)
    for k, s in enumerate((-1, 1)):                                   # the little board roof, its two slopes
        bm = bmesh.new(); vs = [bm.verts.new(v) for v in [(-W - 0.14, 0, 0.62), (W + 0.14, 0, 0.62), (W + 0.14, s * (D + 0.16), 0.38), (-W - 0.14, s * (D + 0.16), 0.38)]]; bm.faces.new(vs); mesh_obj(G, 'lid%d' % k, bm, [mat(G, 'lid', '#7c6246')])
    return dict(view=(1.8, 1.7), aim=0.3, spec=[], bed=None, ember_pts=[])

BUILD = {'a_long': lambda G: long_hearth(G, 4), 'a_small': lambda G: long_hearth(G, 1), 'b_long': lambda G: raised_box(G, 2), 'b_small': lambda G: raised_box(G, 1), 'c_long': lambda G: hung_kettle(G, 2), 'c_small': lambda G: hung_kettle(G, 1), 'ljori': smoke_hole}

def char_logs(G):
    """the embers state: the logs and the coals charred (their materials swapped), the ash paler"""
    cb, ce, cs = mat(G, 'charbark', '#2b2420'), mat(G, 'charend', '#40342c'), mat(G, 'charsplit', '#3a2e27')
    swap = {'f_bark': cb, 'f_end': ce, 'f_split': cs, 'f_coal': mat(G, 'coal2', '#3a3430'), 'f_ash': mat(G, 'ashdead', '#8e8880'), 'f_ashpale': mat(G, 'ashwhite', '#b6b0a6')}
    for o in list(G['Logs'].objects) + list(G['Base'].objects):
        for sl in o.material_slots:
            if sl.material and sl.material.name in swap: sl.material = swap[sl.material.name]
    for o in G['Logs'].objects:                                  # burned down: the logs sag into the ash
        o.scale = (1.0, 1.0, 0.72); o.location.z -= 0.012

def holdout(G):
    m = bpy.data.materials.new('_holdout'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); h = nt.nodes.new('ShaderNodeHoldout'); nt.links.new(h.outputs[0], o.inputs[0]); return m

def render_fire(name):
    G = fresh(); sc, vl = G['sc'], G['vl']; cfg = BUILD[name](G)
    toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
    vw, vh = cfg['view']; cam = toon.camera(sc, ELEV, vw, cfg['aim']); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
    toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
    os.makedirs(OUT, exist_ok=True); shot = lambda tag: (setattr(sc.render, 'filepath', os.path.join(OUT, '%s_%s.png' % (name, tag))), bpy.ops.render.render(write_still=True))
    # the base
    toon.piece_line(toon.freestyle(sc, vl, PX, None, 'cel'), at_colours=True); shot('base')
    # the flames, every base object a hole in the picture where it stands in front of the fire; their own thin ember-brown line
    H = holdout(G); keep = {}
    for coll in ('Base', 'Logs'):
        for o in G[coll].objects:
            keep[o.name] = [sl.material for sl in o.material_slots]
            for sl in o.material_slots: sl.material = H
    fs = toon.freestyle(sc, vl, PX, G['Flames'], 'cel')
    for ls in fs.linesets:
        st = ls.linestyle; st.color = toon.srgb('#7a2a16')[:3]; st.thickness = (1.0 if ls.name == 'contour' else 0.6) * PX
        for mod in list(st.thickness_modifiers): st.thickness_modifiers.remove(mod)
    for f in range(FRAMES): flames(G, cfg['spec'], f / FRAMES); shot('flames_%02d' % f)
    for o in list(G['Flames'].objects): bpy.data.objects.remove(o)
    for coll in ('Base', 'Logs'):
        for o in G[coll].objects:
            for sl, m in zip(o.material_slots, keep[o.name]): sl.material = m
    # the embers: charred logs, ember flecks
    char_logs(G); embers(G, cfg['ember_pts'], 7, bed=cfg.get('bed')); toon.piece_line(toon.freestyle(sc, vl, PX, None, 'cel'), at_colours=True); shot('embers')
    a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
    return {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'frames': FRAMES, 'fps': FPS}

meta_p = os.path.join(OUT, 'meta.json'); meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
for n in (FIRES if WHICH == 'all' else WHICH.split(',')):
    meta[n] = render_fire(n); print('fire', n, meta[n]['w'], 'x', meta[n]['h'], 'anchor', meta[n]['anchor'])
os.makedirs(OUT, exist_ok=True); json.dump(meta, open(meta_p, 'w'), indent=1)
print('fires done', OUT)
