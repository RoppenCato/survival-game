"""The trolls, modelled, rigged and animated by script (2026-10-12, Robin: the trolls after the animals, and two new ones made
from scratch, horrifyingly evil).   node tools/blender.js art/build/troll_build.py -- <boulder|forest|maw|three>

  boulder  the mountain troll after John Bauer: a boulder of a body under a hump, a mane to the ground, moss and a birch
           sapling growing on him, the head hung low in front, a long drooping nose, arms so long he walks on his knuckles
  forest   the forest troll after Theodor Kittelsen: tall and gaunt as a dead pine, a branch of a nose, twig fingers trailing,
           a crown of tangled hair with a fir sapling in it
  maw      new (Gapet, "the gape"): a drowned thing from the sea caves that is nearly all mouth. The whole top of it lifts like
           a lid on rows of needle teeth; one great pale eye, the other socket torn shut; kelp for hair, barnacles on its back,
           thin arms ending in hooks
  three    new (Trehodet, the three-headed troll of the folk tales, starved): a ribcage on stilts with three heads on three
           necks that never look the same way: a skull with pinpoint eyes, a hag hanging low with her jaw open, and a small
           shrivelled one sewn shut that screams. A rope of skulls, bone claws, blood to the elbows

One rig for all four, facing -Y: body (the pelvis: place, pitch, roll, yaw), spine, chest, neck, head, jaw, tail, two arms and
two legs of three bones each, and for the three-headed one two more necks and heads. Every part is a rigid low-poly shape on one
bone. A clip is a function of the phase, baked on every frame: feet (and the boulder troll's knuckles) follow a planted path
and a two-bone solver finds the limb, so they stay on the ground whatever the body does; arms in the air are turned by angles.
Clips: idle, walk, windup (the arm drawn far back), attack (the great slow sweep; the maw lunges and bites), hit, death, shield
(an arm thrown up before the eyes: the fire). Saves art/source/troll_<kind>.blend."""
import bpy, bmesh, math, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
KIND = argv[0] if argv else 'boulder'
NAME = KIND if KIND in ('draugr', 'huldra', 'nacken', 'bysen') else 'troll_' + KIND
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source'); OUT = os.path.abspath(os.path.join(SRC, NAME + '.blend'))
FPS = 24; rad = math.radians; TAU = 2 * math.pi
RNG = random.Random(7)

# ---------------- the kinds: joints in the side view (y, z); x is the limb's distance from the middle ----------------
SPECS = {
    'boulder': {
        'leg': [(0.30, 0.90), (0.02, 0.52), (0.26, 0.15), (-0.12, 0.05)], 'hx': 0.42,
        'arm': [(-0.30, 1.78), (-0.52, 0.98), (-0.72, 0.26), (-0.95, 0.07)], 'sx': 0.86,
        'piv': {'body': (0, 0.28, 0.98), 'spine': (0, 0.18, 1.30), 'chest': (0, 0.02, 1.62)},
        'neck': [(-0.60, 1.86), (-0.84, 1.80)], 'head': [(-0.84, 1.80), (-1.34, 1.62)], 'jaw': [(-0.90, 1.62), (-1.28, 1.44)], 'tail': [(0.78, 0.95), (1.18, 0.55)], 'hs': 1.22,
        'col': {'skin': '#b3a184', 'dark': '#6e6150', 'hair': '#5e5244', 'grey': '#a39c8c', 'moss': '#86a652', 'nose': '#c4a68a', 'eye': '#f4b63a', 'tooth': '#efe6cc', 'nail': '#3a3028', 'bead': '#c05a30', 'birch': '#ece6d4', 'leaf': '#9cc058', 'mouth': '#3a1c18'},
        'knuckle': True, 'walk': dict(S=0.50, h=0.16, beta=0.64, bob=0.035, sway=3.5), 'lie': 0.55,
    },
    'forest': {
        'leg': [(0.10, 1.58), (-0.10, 0.86), (0.14, 0.15), (-0.34, 0.05)], 'hx': 0.24,
        'arm': [(-0.22, 2.66), (-0.20, 1.80), (-0.42, 0.98), (-0.50, 0.50)], 'sx': 0.50,
        'piv': {'body': (0, 0.10, 1.62), 'spine': (0, 0.06, 1.96), 'chest': (0, -0.06, 2.36)},
        'neck': [(-0.26, 2.76), (-0.44, 2.98)], 'head': [(-0.44, 2.98), (-0.98, 2.84)], 'jaw': [(-0.50, 2.86), (-0.92, 2.68)], 'tail': [(0.34, 1.60), (0.80, 1.05)], 'hs': 1.45,
        'col': {'skin': '#ad9a6c', 'dark': '#5b4f3a', 'hair': '#4a4132', 'grey': '#8f8a78', 'moss': '#7d9e4c', 'nose': '#b9a070', 'eye': '#f4b63a', 'tooth': '#efe6cc', 'nail': '#4a3d2c', 'bead': '#c05a30', 'birch': '#6b5a40', 'leaf': '#4d7d46', 'mouth': '#3a1c18'},
        'knuckle': False, 'walk': dict(S=0.95, h=0.30, beta=0.60, bob=0.05, sway=3.0), 'lie': 1.25,
    },
    'maw': {
        'leg': [(0.50, 0.66), (0.12, 0.52), (0.44, 0.15), (0.02, 0.05)], 'hx': 0.74,
        'arm': [(0.12, 0.92), (-0.52, 0.78), (-1.02, 0.28), (-1.30, 0.06)], 'sx': 1.10,
        'piv': {'body': (0, 0.30, 0.72), 'spine': (0, 0.30, 0.80), 'chest': (0, 0.28, 0.88)},
        'neck': [(0.86, 1.02), (0.80, 1.08)], 'head': [(0.80, 1.08), (-0.98, 1.10)], 'jaw': [(0.10, 0.98), (-0.60, 1.00)], 'tail': [(0.95, 0.70), (1.45, 0.30)],
        'col': {'skin': '#c6c492', 'belly': '#e2ddc0', 'dark': '#5f6048', 'gum': '#9a3438', 'vein': '#b03030', 'bone': '#efe8d2', 'mouth': '#541a1e', 'tongue': '#a03c46', 'tooth': '#f2ecd6', 'eye': '#f4f1e2', 'pupil': '#0e0c0c', 'kelp': '#4d6a4c', 'barnacle': '#ddd6c4', 'nail': '#2c2a26', 'blood': '#8a2420', 'scar': '#8a5a58'},
        'knuckle': True, 'walk': dict(S=0.42, h=0.14, beta=0.64, bob=0.03, sway=4.0), 'lie': 0.25,
    },
    'three': {
        'leg': [(0.10, 1.52), (-0.10, 0.84), (0.14, 0.15), (-0.30, 0.05)], 'hx': 0.25,
        'arm': [(-0.12, 2.60), (-0.14, 1.76), (-0.38, 1.02), (-0.46, 0.60)], 'sx': 0.66,
        'piv': {'body': (0, 0.10, 1.56), 'spine': (0, 0.08, 1.90), 'chest': (0, -0.02, 2.28)},
        'neck': [(-0.10, 2.74), (-0.30, 3.08)], 'head': [(-0.30, 3.08), (-0.74, 2.94)], 'jaw': [(-0.36, 2.96), (-0.70, 2.80)], 'tail': None, 'hs': 1.4,
        'col': {'skin': '#e0d6b2', 'shade': '#a39a84', 'dark': '#262020', 'hair': '#332d2a', 'bone': '#efe8d2', 'blood': '#8a221c', 'hide': '#7a6450', 'rope': '#8a7852', 'eye': '#f0452a', 'white': '#f2eedc', 'tooth': '#efe6cc', 'mouth': '#3a1214'},
        'knuckle': False, 'walk': dict(S=0.85, h=0.26, beta=0.60, bob=0.05, sway=3.5), 'lie': 1.20,
        'heads': {'L': {'neck': [(0.30, -0.06, 2.66), (0.82, -0.48, 2.52)], 'head': [(0.82, -0.48, 2.52), (0.98, -0.92, 2.22)]},
                  'R': {'neck': [(-0.30, -0.04, 2.68), (-0.66, -0.16, 3.02)], 'head': [(-0.66, -0.16, 3.02), (-0.86, -0.46, 3.04)]}},
    },
}
# ---- the people-shaped vasen (2026-10-12, Robin: the draugr, the huldra, Nacken and the bysen): the hero's build, 1.8 m, a big head
def person(col, **kw):
    d = {'leg': [(0.02, 0.80), (-0.02, 0.44), (0.04, 0.10), (-0.17, 0.04)], 'hx': 0.11,
         'arm': [(0.0, 1.27), (0.03, 1.01), (-0.02, 0.78), (-0.04, 0.66)], 'sx': 0.25,
         'piv': {'body': (0, 0.02, 0.84), 'spine': (0, 0.02, 0.98), 'chest': (0, 0.01, 1.12)},
         'neck': [(0.0, 1.30), (0.0, 1.37)], 'head': [(0.0, 1.37), (-0.25, 1.37)], 'jaw': [(-0.02, 1.45), (-0.20, 1.43)], 'tail': None,
         'col': col, 'knuckle': False, 'walk': dict(S=0.46, h=0.11, beta=0.60, bob=0.02, sway=2.5), 'lie': 0.62, 'person': True}
    d.update(kw); return d
SPECS['draugr'] = person({'skin': '#8fa9b4', 'dark': '#3d4f5c', 'mail': '#9a968a', 'rust': '#96603c', 'cloth': '#5d6a66', 'kelp': '#4d6a4c', 'beard': '#c9c6b4', 'eye': '#e9f4ee', 'tooth': '#e6dfc6', 'wood': '#8a6e50', 'iron': '#8f8f8a', 'barnacle': '#ddd6c4', 'mouth': '#2a2026'},
    walk=dict(S=0.34, h=0.06, beta=0.68, bob=0.025, sway=6.0), clips=['idle', 'walk', 'windup', 'attack', 'hit', 'shield', 'death'], slump=0.45)
SPECS['huldra'] = person({'skin': '#f6d8be', 'dress': '#d8442e', 'trim': '#f0c95a', 'hair': '#f3dc8c', 'bark': '#8a6e50', 'rot': '#2a1f18', 'fungus': '#e6d6b0', 'moss': '#86a652', 'eye': '#2a2420', 'lip': '#b8323a', 'flowerA': '#f2f0e4', 'flowerB': '#6f9fe0', 'shoe': '#6b4a34'},
    walk=dict(S=0.30, h=0.07, beta=0.62, bob=0.012, sway=2.0), clips=['idle', 'walk', 'call', 'hit', 'death'])
SPECS['nacken'] = person({'skin': '#dfe8de', 'tunic': '#4f8a7a', 'trouser': '#8a6a4c', 'hair': '#3a4a44', 'eye': '#20302c', 'belt': '#5a4632', 'reed': '#9ab05a', 'lily': '#f4f2e6', 'lilyc': '#f0c040', 'wood': '#b08a5a', 'string': '#f0e8d0', 'rock': '#9a9a94', 'moss': '#86a652', 'lip': '#8f9a98'},
    clips=['idle', 'walk', 'play', 'hit', 'death'],
    pbones={'lyreA': ((0, 0.20, 1.10), (0, 0.20, 1.30), 'chest', 1.0), 'lyreB': ((0.04, -0.20, 1.04), (0.04, -0.20, 1.24), 'chest', 0.0), 'rock': ((0, 0.10, 0.0), (0, 0.10, 0.2), 'root', 0.0)})
SPECS['bysen'] = person({'skin': '#e8c8a8', 'coat': '#a8a69c', 'trouser': '#7d7a70', 'cap': '#d23c2c', 'beard': '#e6e2d6', 'eye': '#201c1a', 'shoe': '#5a4632', 'wood': '#b08a5a', 'iron': '#9a9a96', 'bark': '#8a6e50', 'ring': '#e2cc9c', 'moss': '#86a652', 'spot': '#f4f2e6', 'nose': '#e0a890'},
    clips=['idle', 'walk', 'chop', 'hide', 'stump'], hs=1.3, size=0.5,
    pbones={'stump': ((0, 0.0, 0.0), (0, 0.0, 0.3), 'root', 0.0)}, sdefault={'body': 1.0})
S = SPECS[KIND]; PIV = S['piv']

# ---------------- scene, materials, mesh helpers ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
body_c = bpy.data.collections.new('Body'); gear_c = bpy.data.collections.new('Gear')
sc.collection.children.link(body_c); sc.collection.children.link(gear_c)
C = {k: toon.material(NAME + '_' + k, v, None, 'cel') for k, v in S['col'].items()}
PARTS = []; _n = [0]
def mesh_object(name, bm, mat, group, smooth=True):
    _n[0] += 1; name = '%s_%03d' % (name, _n[0])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); body_c.objects.link(o); me.materials.append(mat)
    o.vertex_groups.new(name=group).add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    for p in me.polygons: p.use_smooth = smooth
    PARTS.append(o); return o
def cone(name, mat, group, p0, p1, r0, r1, seg=8, sx=1.0, sy=1.0, smooth=True):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = TAU * (i + 0.5) / seg; v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return mesh_object(name, bm, mat, group, smooth)
def ball(name, mat, group, c, r, sx=1.0, sy=1.0, sz=1.0, seg=10, rings=7, rot=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts:
        p = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
        if rot is not None: p = rot @ p
        v.co = p + Vector(c)
    return mesh_object(name, bm, mat, group)
def hang(name, mat, group, pts, length, r, lean=0.0, seg=5, flat=0.55, vary=0.35, out=None):
    """strands hanging from points: hair, a mane, kelp, a beard. lean: how far each swings out from the middle as it falls"""
    for p in pts:
        p = Vector(p); L = length * (1 - vary + 2 * vary * RNG.random()); o = Vector((p.x, p.y - (out[1] if out else 0), 0))
        o = o.normalized() * lean * L if o.length > 0.01 else Vector((0, 0, 0))
        cone(name, mat, group, p, p + o + Vector(((RNG.random() - 0.5) * 0.08, (RNG.random() - 0.5) * 0.08, -L)), r * (0.8 + 0.4 * RNG.random()), r * 0.08, seg=seg, sy=flat)
V3 = lambda yz, x=0.0: Vector((x, yz[0], yz[1]))
def frame_of(base, tip):
    """a head's own directions: along the muzzle, up, and to its left"""
    b, t = Vector(base), Vector(tip); hd = (t - b).normalized(); side = Vector((0, 0, 1)).cross(hd)
    side = side.normalized() if side.length > 0.01 else Vector((1, 0, 0))
    if side.x < 0: side = -side
    up = hd.cross(side);
    if up.z < 0: up = -up
    return b, hd, up, side, (t - b).length
def pointer(base, tip):
    b, hd, up, side, L = frame_of(base, tip)
    return (lambda along, upw=0.0, sd=0.0: b + hd * along + up * upw + side * sd), L, hd, up, side

# ---------------- the rig ----------------
arm_data = bpy.data.armatures.new(NAME + 'Rig'); rig = bpy.data.objects.new(NAME + 'Rig', arm_data); sc.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); EB = arm_data.edit_bones
def bone(name, head, tail, parent=None):
    b = EB.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = EB[parent]
    return b
bone('root', (0, 0, 0), (0, 0.3, 0))
bone('body', PIV['body'], Vector(PIV['body']) + Vector((0, 0, 0.2)), 'root')
bone('spine', PIV['spine'], Vector(PIV['spine']) + Vector((0, 0, 0.2)), 'body')
bone('chest', PIV['chest'], Vector(PIV['chest']) + Vector((0, 0, 0.2)), 'spine')
bone('neck', V3(S['neck'][0]), V3(S['neck'][1]), 'chest'); bone('head', V3(S['head'][0]), V3(S['head'][1]), 'neck'); bone('jaw', V3(S['jaw'][0]), V3(S['jaw'][1]), 'head')
if S['tail']: bone('tail', V3(S['tail'][0]), V3(S['tail'][1]), 'body')
for hk, hs in S.get('heads', {}).items():
    bone('neck' + hk, hs['neck'][0], hs['neck'][1], 'chest'); bone('head' + hk, hs['head'][0], hs['head'][1], 'neck' + hk)
    b, hd, up, side, L = frame_of(hs['head'][0], hs['head'][1]); bone('jaw' + hk, b + hd * 0.08 - up * 0.10, b + hd * L * 0.9 - up * 0.16, 'head' + hk)
SBONES = dict(S.get('sdefault', {}))
for bn, (bh, bt, bpar, bdef) in S.get('pbones', {}).items(): bone(bn, bh, bt, bpar); SBONES[bn] = bdef
LIMBS = {}
for side, sgn in (('L', 1), ('R', -1)):
    for kind, J, x, par in (('l', S['leg'], S['hx'], 'body'), ('a', S['arm'], S['sx'], 'chest')):
        n = kind + side; pts = [V3(p, sgn * x) for p in J]
        bone(n + '_up', pts[0], pts[1], par); bone(n + '_lo', pts[1], pts[2], n + '_up'); bone(n + '_ft', pts[2], pts[3], n + '_lo')
        LIMBS[n] = {'kind': kind, 'x': sgn * x, 'J': J, 'parent': par, 'sgn': sgn}
bpy.ops.object.mode_set(mode='OBJECT')
def ang_of(p, q): return math.atan2(-(q[0] - p[0]), -(q[1] - p[1]))      # a direction by its angle from straight down, positive toward the front
for n, L in LIMBS.items():
    J = L['J']; L['len'] = [math.hypot(J[i + 1][0] - J[i][0], J[i + 1][1] - J[i][1]) for i in range(3)]; L['rest'] = [ang_of(J[i], J[i + 1]) for i in range(3)]
MARKS = []
def mark(name, p, parent):                          # a point exported per frame (the eyes, for the glow in the dark)
    MARKS.append((name, Vector(p), parent))

# ---------------- shared parts ----------------
def limb(n, mat, r, knob=None, kmat=None):
    """a limb's two long bones as tapered tubes: r = (top, middle, bottom); knob: a ball at the middle joint"""
    L = LIMBS[n]; p = [V3(q, L['x']) for q in L['J']]
    cone(n + 'up', mat, n + '_up', p[0], p[1], r[0], r[1]); cone(n + 'lo', mat, n + '_lo', p[1], p[2], r[1] * 0.96, r[2])
    ball(n + 'sh', mat, n + '_up', p[0], r[0] * 1.02)
    if knob: ball(n + 'kn', kmat or mat, n + '_lo', p[1], knob)
    return p
def foot(n, mat, nail, r, toes=3, tl=0.16, tr=0.05):
    L = LIMBS[n]; a, t = V3(L['J'][2], L['x']), V3(L['J'][3], L['x']); m = a.lerp(t, 0.55); m.z = max(r * 0.55, m.z * 0.6)
    ball(n + 'foot', mat, n + '_ft', m, r, sx=1.0, sy=(a - t).length / r * 0.62, sz=0.55); ball(n + 'heel', mat, n + '_ft', (a.x, a.y, a.z * 0.9), r * 0.8)
    for i in range(toes):
        dx = (i - (toes - 1) / 2) * r * 0.62; b = Vector((t.x + dx, t.y + 0.04, 0.05)); cone(n + 'toe', nail, n + '_ft', b, b + Vector((dx * 0.5, -tl, -0.01)), tr, tr * 0.25, seg=5)
def hand(n, mat, nail, r, fingers=4, fl=0.22, fr=0.05, spread=0.6, curl=0.0):
    L = LIMBS[n]; w, t = V3(L['J'][2], L['x']), V3(L['J'][3], L['x']); d = (t - w); m = w + d * 0.45
    ball(n + 'hand', mat, n + '_ft', m, r, sx=1.15, sy=1.0, sz=0.8)
    dn = d.normalized(); sd = Vector((1, 0, 0))
    for i in range(fingers):
        k = (i - (fingers - 1) / 2); b = m + dn * r * 0.6 + sd * k * r * 0.5; cone(n + 'fin', nail, n + '_ft', b, b + dn * fl + sd * k * fl * spread * 0.4 + Vector((0, -curl * fl, 0)), fr, fr * 0.2, seg=5)

# ---------------- the four ----------------
def build_boulder():
    sk, hair = C['skin'], C['hair']
    ball('belly', sk, 'body', (0, 0.30, 1.02), 0.64, sx=1.22, sy=1.0, sz=0.95, seg=12, rings=8)
    ball('mid', sk, 'spine', (0, 0.16, 1.48), 0.70, sx=1.24, sy=1.02, sz=0.95, seg=12, rings=8)
    ball('hump', sk, 'chest', (0, 0.10, 1.92), 0.74, sx=1.26, sy=1.08, sz=0.90, seg=12, rings=8)
    for (x, y, z, r) in ((0.62, -0.25, 1.75, 0.16), (-0.70, 0.05, 1.50, 0.19), (0.45, 0.62, 1.35, 0.17), (-0.40, -0.45, 2.20, 0.13)): ball('stone', C['grey'], 'chest', (x, y, z), r, sz=0.75, seg=7, rings=5)
    for (x, y, z, r) in ((0.25, 0.10, 2.56, 0.30), (-0.30, 0.30, 2.50, 0.26), (0.05, -0.30, 2.50, 0.22), (0.55, 0.40, 2.25, 0.2)): ball('moss', C['moss'], 'chest', (x, y, z), r, sz=0.32, seg=8, rings=5)
    cone('birch', C['birch'], 'chest', (-0.18, 0.28, 2.52), (-0.26, 0.34, 3.06), 0.035, 0.015, seg=5)
    for (dx, dy, dz, r) in ((0, 0, 0.0, 0.17), (0.12, 0.05, -0.14, 0.13), (-0.12, -0.04, -0.10, 0.13)): ball('leaf', C['leaf'], 'chest', (-0.26 + dx, 0.34 + dy, 3.10 + dz), r, sz=0.8, seg=7, rings=5)
    row = lambda rr, ry, z, a0, a1, n: [(math.sin(rad(a0 + (a1 - a0) * i / (n - 1))) * rr, 0.10 + math.cos(rad(a0 + (a1 - a0) * i / (n - 1))) * ry, z) for i in range(n)]
    hang('mane', hair, 'chest', row(0.88, 0.80, 2.05, -112, 112, 13), 1.35, 0.16, lean=0.16, out=(0, 0.10))
    hang('mane2', hair, 'chest', row(0.66, 0.60, 2.36, -125, 125, 11), 0.95, 0.15, lean=0.22, out=(0, 0.10))
    hang('mane3', C['grey'], 'chest', row(0.36, 0.34, 2.56, -150, 150, 8), 0.60, 0.12, lean=0.35, out=(0, 0.10))
    hp, HL, hd, up, side = pointer(V3(S['head'][0]), V3(S['head'][1]))
    cone('neck', sk, 'neck', V3(S['neck'][0]) + Vector((0, 0.2, 0.05)), V3(S['neck'][1]), 0.42, 0.34)
    ball('skull', sk, 'head', hp(0.20, 0.02), 0.38, sx=1.16, sy=1.0, sz=0.92, seg=12, rings=8)
    ball('brow', hair, 'head', hp(0.36, 0.23), 0.13, sx=2.9, sy=1.0, sz=0.62)                     # one heavy brow across both eyes
    for sg in (1, -1):
        ball('socket', C['dark'], 'head', hp(0.44, 0.08, sg * 0.17), 0.10, sy=0.6); ball('eye', C['eye'], 'head', hp(0.52, 0.07, sg * 0.17), 0.052); mark('eye.' + ('L' if sg > 0 else 'R'), hp(0.50, 0.07, sg * 0.17), 'head')
        ball('ear', sk, 'head', hp(0.02, 0.10, sg * 0.50), 0.24, sx=0.9, sy=0.32, sz=1.0, rot=Matrix.Rotation(rad(sg * 28), 3, 'Y')); ball('earin', C['dark'], 'head', hp(0.05, 0.10, sg * 0.52), 0.13, sx=0.8, sy=0.3)
        hang('tuft', hair, 'head', [hp(0.42, 0.25, sg * 0.30)], 0.26, 0.05, lean=0.5)
    ball('ring', C['bead'], 'head', hp(0.02, -0.14, 0.56), 0.05)
    n0 = hp(0.50, 0.06); n1 = n0 + hd * 0.26 - up * 0.40
    cone('nose', C['nose'], 'head', n0, n1, 0.10, 0.085); ball('bulb', C['nose'], 'head', n1, 0.13, sz=1.1); ball('wart', C['dark'], 'head', n1 + side * 0.09 + up * 0.07, 0.035)
    hang('crown', hair, 'head', [hp(0.0 + 0.08 * i, 0.34 - 0.03 * abs(i - 1), s2 * 0.26) for i in range(4) for s2 in (1, -1, 0)], 0.55, 0.11, lean=0.45)
    jp, JL, jd, jup, jside = pointer(V3(S['jaw'][0]), V3(S['jaw'][1]))
    ball('mouth', C['mouth'], 'head', hp(0.36, -0.20), 0.24, sx=1.25, sy=0.9, sz=0.35)
    ball('jaw', sk, 'jaw', jp(0.20, -0.04), 0.27, sx=1.3, sy=1.05, sz=0.55)
    for sg in (1, -1): cone('tusk', C['tooth'], 'jaw', jp(0.30, 0.06, sg * 0.22), jp(0.36, 0.26, sg * 0.25), 0.045, 0.012, seg=5)
    hang('beard', C['grey'], 'jaw', [jp(0.30, -0.10, k * 0.11) for k in (-2, -1, 0, 1, 2)] + [jp(0.12, -0.10, k * 0.16) for k in (-1.5, 1.5)], 0.75, 0.10, lean=0.1)
    for i in range(7):                              # the beads: a string hanging under the chin
        a = rad(-60 + i * 20); ball('bead', C['bead'] if i % 2 else C['tooth'], 'chest', (math.sin(a) * 0.46, -0.74 - math.cos(a) * 0.05, 1.46 - math.cos(a) * 0.22), 0.055, seg=6, rings=4)
    for sd in ('L', 'R'):
        limb('a' + sd, sk, (0.26, 0.21, 0.19)); hand('a' + sd, sk, C['nail'], 0.23, fingers=4, fl=0.22, fr=0.06)
        limb('l' + sd, sk, (0.30, 0.22, 0.17)); foot('l' + sd, sk, C['nail'], 0.22, toes=3, tl=0.14, tr=0.055)
    t0, t1 = V3(S['tail'][0]), V3(S['tail'][1]); cone('tail', sk, 'tail', t0, t1, 0.07, 0.035); hang('tailtuft', hair, 'tail', [t1 + Vector((dx, 0, 0.05)) for dx in (-0.04, 0.04, 0)], 0.3, 0.07)

def build_forest():
    sk, hair = C['skin'], C['hair']
    cone('pelvis', sk, 'body', (0, 0.14, 1.42), (0, 0.08, 1.98), 0.30, 0.25, sx=1.15)
    cone('waist', sk, 'spine', (0, 0.08, 1.90), (0, -0.06, 2.42), 0.25, 0.31, sx=1.2)
    cone('ribs', sk, 'chest', (0, -0.06, 2.34), (0, -0.20, 2.82), 0.36, 0.24, sx=1.45)
    for sg in (1, -1): ball('shoulder', sk, 'chest', (sg * 0.50, -0.20, 2.70), 0.19)
    for z in (2.05, 2.25, 2.48, 2.66): cone('bark', C['dark'], 'chest' if z > 2.3 else 'spine', (0.20 * (1 if int(z * 10) % 2 else -1), -0.34 - (z - 2.0) * 0.16, z), (0.10 * (1 if int(z * 10) % 2 else -1), -0.33 - (z - 2.0) * 0.16, z - 0.22), 0.022, 0.006, seg=4)
    for (x, y, z, r) in ((0.40, -0.10, 2.86, 0.20), (-0.46, -0.05, 2.84, 0.17), (0.10, 0.20, 2.80, 0.18)): ball('moss', C['moss'], 'chest', (x, y, z), r, sz=0.35, seg=8, rings=5)
    hang('mane', hair, 'chest', [(math.sin(rad(a)) * 0.50, -0.05 + math.cos(rad(a)) * 0.34, 2.78) for a in range(-100, 101, 25)], 1.00, 0.10, lean=0.10)
    hang('skirt', hair, 'body', [(math.sin(rad(a)) * 0.34, 0.12 + math.cos(rad(a)) * 0.30, 1.62) for a in range(0, 360, 30)], 0.60, 0.09, lean=0.15)
    hp, HL, hd, up, side = pointer(V3(S['head'][0]), V3(S['head'][1]))
    cone('neck', sk, 'neck', V3(S['neck'][0]) + Vector((0, 0.08, -0.10)), V3(S['neck'][1]), 0.15, 0.12)
    cone('skull', sk, 'head', hp(-0.12, 0.02), hp(0.40, 0.0), 0.22, 0.17, sx=0.95); ball('pate', sk, 'head', hp(-0.10, 0.03), 0.23)
    n0 = hp(0.38, 0.02); n1 = n0 + hd * 0.62 - up * 0.26
    cone('nose', C['nose'], 'head', n0, n1, 0.085, 0.022, seg=6); cone('twig', C['nose'], 'head', n0.lerp(n1, 0.55), n0.lerp(n1, 0.55) + up * 0.16 + hd * 0.10, 0.02, 0.004, seg=4)
    ball('brow', hair, 'head', hp(0.30, 0.14), 0.08, sx=2.6, sz=0.6)
    for sg in (1, -1):
        ball('socket', C['dark'], 'head', hp(0.33, 0.06, sg * 0.10), 0.06, sy=0.6); ball('eye', C['eye'], 'head', hp(0.37, 0.055, sg * 0.105), 0.024); mark('eye.' + ('L' if sg > 0 else 'R'), hp(0.37, 0.055, sg * 0.105), 'head')
        cone('ear', sk, 'head', hp(0.0, 0.06, sg * 0.18), hp(-0.14, 0.22, sg * 0.52), 0.09, 0.008, seg=5, sy=0.35)
    for i in range(11):                             # the crown: twigs standing out of tangled hair
        a = rad(i * 33); b = hp(-0.10 + 0.06 * math.cos(a), 0.18, 0.14 * math.sin(a)); cone('twigs', C['birch'], 'head', b, b + up * (0.30 + 0.25 * RNG.random()) - hd * (0.10 + 0.25 * RNG.random()) + side * 0.3 * math.sin(a), 0.03, 0.004, seg=4)
    hang('hair', hair, 'head', [hp(-0.20 + 0.05 * (i % 3), 0.10, (i - 3.5) * 0.07) for i in range(8)], 0.70, 0.07, lean=0.2)
    f0 = hp(-0.06, 0.22)
    cone('firstem', C['birch'], 'head', f0, f0 + Vector((0, 0.03, 0.26)), 0.02, 0.012, seg=4)
    for i in range(3): cone('fir', C['leaf'], 'head', f0 + Vector((0, 0.03, 0.20 + i * 0.16)), f0 + Vector((0, 0.03, 0.44 + i * 0.16)), 0.17 - i * 0.045, 0.01, seg=7)
    jp, JL, jd, jup, jside = pointer(V3(S['jaw'][0]), V3(S['jaw'][1]))
    ball('mouth', C['mouth'], 'head', hp(0.22, -0.12), 0.14, sx=1.0, sy=1.3, sz=0.35)
    cone('jaw', sk, 'jaw', jp(-0.02, -0.02), jp(JL * 0.9, 0.0), 0.15, 0.07, sy=0.5)
    for k in (-1, 1): cone('fang', C['tooth'], 'jaw', jp(JL * 0.7, 0.03, k * 0.06), jp(JL * 0.74, 0.17, k * 0.07), 0.025, 0.006, seg=4)
    hang('beard', hair, 'jaw', [jp(JL * 0.6, -0.04, k * 0.05) for k in (-1, 0, 1)], 0.7, 0.06)
    for sd in ('L', 'R'):
        limb('a' + sd, sk, (0.12, 0.085, 0.07), knob=0.115); hand('a' + sd, sk, C['nail'], 0.10, fingers=4, fl=0.46, fr=0.03, spread=0.9)
        limb('l' + sd, sk, (0.16, 0.10, 0.085), knob=0.15); foot('l' + sd, sk, C['nail'], 0.14, toes=4, tl=0.30, tr=0.035)
    t0, t1 = V3(S['tail'][0]), V3(S['tail'][1]); cone('tail', sk, 'tail', t0, t1, 0.045, 0.02, seg=5); hang('tailtuft', hair, 'tail', [t1 + Vector((dx, 0, 0.04)) for dx in (-0.03, 0.03)], 0.35, 0.06)

def build_maw():
    sk = C['skin']
    ball('bowl', sk, 'chest', (0, -0.02, 0.70), 0.98, sx=1.16, sy=1.04, sz=0.60, seg=14, rings=9)             # the lower jaw is the body
    ball('under', C['belly'], 'chest', (0, -0.20, 0.52), 0.80, sx=1.12, sy=1.0, sz=0.50, seg=12, rings=7)
    ball('gullet', C['mouth'], 'chest', (0, -0.06, 0.99), 0.90, sx=1.14, sy=1.02, sz=0.16, seg=14, rings=6)
    ball('tongue', C['tongue'], 'jaw', (0, -0.30, 1.04), 0.42, sx=0.8, sy=1.35, sz=0.26)
    ball('dome', sk, 'head', (0, -0.04, 1.46), 1.0, sx=1.17, sy=1.05, sz=0.46, seg=14, rings=9)                 # the lid: everything above the teeth
    ball('palate', C['mouth'], 'head', (0, -0.06, 1.17), 0.90, sx=1.14, sy=1.02, sz=0.16, seg=14, rings=6)
    for i in range(23):                             # teeth all the way round the front and sides, long and uneven, top and bottom
        a = rad(-125 + i * 250 / 22); L = 0.20 + 0.26 * RNG.random()
        p = Vector((math.sin(a) * 1.04, -0.05 - math.cos(a) * 0.96, 1.02)); cone('toothlo', C['tooth'], 'chest', p, p + Vector((-math.sin(a) * 0.06, math.cos(a) * 0.06, L)), 0.045, 0.004, seg=5)
        a2 = a + rad(5.4); L2 = 0.22 + 0.30 * RNG.random()
        p2 = Vector((math.sin(a2) * 1.05, -0.05 - math.cos(a2) * 0.98, 1.20)); cone('toothup', C['tooth'], 'head', p2, p2 + Vector((-math.sin(a2) * 0.05, math.cos(a2) * 0.05, -L2)), 0.048, 0.004, seg=5)
    for i in range(9):                              # a second row inside, smaller
        a = rad(-80 + i * 20); p = Vector((math.sin(a) * 0.72, -0.05 - math.cos(a) * 0.66, 1.03)); cone('tooth2', C['tooth'], 'chest', p, p + Vector((0, 0, 0.16)), 0.03, 0.003, seg=4)
    for (x, y, z, r) in ((0.30, -1.02, 0.80, 0.07), (-0.55, -0.86, 0.74, 0.09), (0.05, -1.05, 0.66, 0.06)): ball('bloodlip', C['blood'], 'chest', (x, y, z), r, sz=1.8, sy=0.4, seg=6, rings=5)
    ball('gumlo', C['gum'], 'chest', (0, -0.05, 1.00), 1.0, sx=1.10, sy=1.0, sz=0.07, seg=14, rings=5); ball('gumup', C['gum'], 'head', (0, -0.05, 1.19), 1.0, sx=1.11, sy=1.01, sz=0.07, seg=14, rings=5)
    ball('humpback', sk, 'head', (0, 0.50, 1.62), 0.74, sx=1.15, sy=1.0, sz=0.62, seg=12, rings=8); ball('humpback2', C['dark'], 'head', (0, 0.78, 1.40), 0.55, sx=1.2, sy=0.9, sz=0.7)
    for (x, y, z, r) in ((0.75, -0.30, 1.66, 0.16), (-0.20, -0.55, 1.80, 0.20), (-0.85, -0.20, 1.55, 0.14), (0.30, 0.20, 1.92, 0.22), (0.9, 0.0, 0.62, 0.2), (-0.7, -0.6, 0.55, 0.18)): ball('blotch', C['dark'], 'head' if z > 1.2 else 'chest', (x, y, z), r, sz=0.22, seg=7, rings=5)
    e = Vector((0.44, -0.84, 1.56))                 # the one eye: huge, bloodshot, a slit of a pupil, glaring from under a heavy lid
    ball('eye', C['eye'], 'head', e, 0.24, seg=12, rings=8); ball('pupil', C['pupil'], 'head', e + Vector((0.05, -0.215, -0.02)), 0.05, sx=0.45, sz=1.5)
    ball('lid', C['dark'], 'head', e + Vector((0.0, 0.0, 0.11)), 0.27, sz=0.62, rot=Matrix.Rotation(rad(-24), 3, 'Y')); ball('bag', C['dark'], 'head', e + Vector((0.0, 0.02, -0.16)), 0.24, sz=0.35)
    for k in range(5): a = rad(200 + k * 35); cone('vein', C['vein'], 'head', e + Vector((math.cos(a) * 0.20, -0.13, math.sin(a) * 0.17)), e + Vector((math.cos(a) * 0.09, -0.225, math.sin(a) * 0.07)), 0.012, 0.004, seg=3)
    for sg in (1, -1): hang('drool', C['blood'], 'chest', [(sg * 1.02, -0.45, 0.98), (sg * 0.86, -0.78, 0.98)], 0.42, 0.045, vary=0.5)
    b0 = Vector((-0.62, -0.84, 1.06))               # what is left of the last one: an arm hanging out between the teeth
    cone('armbone', C['bone'], 'chest', b0, b0 + Vector((-0.12, -0.34, -0.10)), 0.035, 0.03, seg=5); cone('armbone2', C['bone'], 'chest', b0 + Vector((-0.12, -0.34, -0.10)), b0 + Vector((-0.16, -0.44, -0.44)), 0.03, 0.025, seg=5)
    for k in (-1, 0, 1): cone('fingerbone', C['bone'], 'chest', b0 + Vector((-0.16, -0.44, -0.44)), b0 + Vector((-0.16 + k * 0.05, -0.47, -0.58)), 0.012, 0.004, seg=3)
    ball('gore', C['blood'], 'chest', b0 + Vector((0, -0.02, 0)), 0.07)
    mark('eye.L', e + Vector((0.03, -0.2, 0)), 'head')
    s0 = Vector((-0.50, -0.80, 1.58)); ball('blind', C['scar'], 'head', s0, 0.20, sy=0.45, sz=0.8)                # the other socket, torn and healed shut
    for k in range(4): cone('scarline', C['dark'], 'head', s0 + Vector((-0.20 + k * 0.11, -0.10, 0.20)), s0 + Vector((-0.08 + k * 0.11, -0.12, -0.20)), 0.02, 0.006, seg=4)
    hang('kelp', C['kelp'], 'head', [(math.sin(rad(a)) * 1.16, 0.20 + math.cos(rad(a)) * 1.02, 1.50) for a in range(-100, 101, 14)], 1.15, 0.15, lean=0.12, flat=0.3)
    hang('kelp2', C['kelp'], 'head', [(x, y, 2.02) for (x, y) in ((0.4, 0.5), (-0.4, 0.55), (0, 0.8), (0.6, 0.85), (-0.65, 0.9), (0.15, 1.0))], 0.8, 0.13, lean=0.8, flat=0.3)
    for i in range(7): cone('spine', C['dark'], 'head', (0, -0.40 + i * 0.24, 1.90 + 0.10 * math.sin(i * 0.55)), (0, -0.26 + i * 0.26, 2.30 + 0.20 * math.sin(i * 0.55) + 0.12 * (i % 2)), 0.08, 0.006, seg=5, sx=0.4)
    for (x, y, z) in ((0.70, 0.50, 1.60), (0.80, 0.42, 1.52), (0.66, 0.60, 1.52), (-0.80, 0.30, 1.56), (-0.72, 0.42, 1.60), (-0.9, 0.10, 0.80), (-0.96, 0.22, 0.72), (0.95, 0.30, 0.76)): ball('barnacle', C['barnacle'], 'head' if z > 1.2 else 'chest', (x, y, z), 0.07, sz=0.8, seg=6, rings=4)
    for sd in ('L', 'R'):
        limb('a' + sd, sk, (0.15, 0.085, 0.07), knob=0.12, kmat=C['dark']); hand('a' + sd, C['dark'], C['nail'], 0.10, fingers=3, fl=0.44, fr=0.045, spread=1.2, curl=0.25)
        limb('l' + sd, sk, (0.30, 0.19, 0.14)); foot('l' + sd, C['dark'], C['nail'], 0.20, toes=3, tl=0.22, tr=0.05)
    t0, t1 = V3(S['tail'][0]), V3(S['tail'][1]); cone('tail', sk, 'tail', V3((0.80, 0.72)), t1, 0.20, 0.03, sx=0.5); cone('fin', C['dark'], 'tail', t1 + Vector((0, -0.1, 0)), t1 + Vector((0, 0.28, 0.06)), 0.16, 0.01, seg=6, sx=0.15)

def skull_small(group, c, r, face):
    ball('sk', C['bone'], group, c, r, sz=1.1, seg=8, rings=6)
    for sg in (1, -1): ball('sks', C['dark'], group, Vector(c) + face * r * 0.78 + Vector((sg * r * 0.38, 0, r * 0.12)), r * 0.26, seg=6, rings=4)
def build_three():
    sk, sh = C['skin'], C['shade']
    cone('pelvis', sk, 'body', (0, 0.12, 1.40), (0, 0.09, 1.72), 0.28, 0.22, sx=1.25)
    cone('waist', sh, 'spine', (0, 0.10, 1.66), (0, 0.0, 2.24), 0.15, 0.20, sx=1.2)                              # starved: a spine and a hollow
    cone('chest', sh, 'chest', (0, -0.01, 2.14), (0, -0.10, 2.72), 0.30, 0.30, sx=1.75)
    for i in range(5):                              # the ribs, standing out pale over the dark between them
        z = 2.22 + i * 0.105; ball('rib', sk, 'chest', (0, -0.03 - i * 0.016, z), 0.325 + 0.012 * min(i, 2), sx=1.78, sy=1.05, sz=0.10, seg=12, rings=5, rot=Matrix.Rotation(rad(-14), 3, 'X'))
    cone('breast', C['bone'], 'chest', (0, -0.36, 2.20), (0, -0.42, 2.70), 0.045, 0.06, seg=5)
    for i in range(7): ball('vert', sk, 'spine' if i < 4 else 'chest', (0, 0.26 - i * 0.012, 1.72 + i * 0.15), 0.065, seg=6, rings=4)
    for sg in (1, -1): ball('shoulder', sk, 'chest', (sg * 0.64, -0.10, 2.62), 0.17); cone('collar', C['bone'], 'chest', (sg * 0.06, -0.40, 2.70), (sg * 0.62, -0.18, 2.70), 0.04, 0.045, seg=5)
    hang('hide', C['hide'], 'body', [(math.sin(rad(a)) * 0.36, 0.12 + math.cos(rad(a)) * 0.30, 1.66) for a in range(0, 360, 24)], 0.62, 0.13, lean=0.12, flat=0.3)
    for i in range(6):                              # the rope of skulls from the left shoulder to the right hip
        k = i / 5.0; p = Vector((0.52 - 0.95 * k, -0.34 - 0.16 * math.sin(math.pi * k), 2.60 - 0.80 * k)); skull_small('chest' if k < 0.6 else 'spine', p, 0.085, Vector((0, -1, 0)))
        if i < 5: q = Vector((0.52 - 0.95 * (k + 0.2), -0.34 - 0.16 * math.sin(math.pi * (k + 0.2)), 2.60 - 0.80 * (k + 0.2))); cone('rope', C['rope'], 'chest' if k < 0.6 else 'spine', p, q, 0.02, 0.02, seg=4)
    # the first head: a skull with the skin still on it, pinpoints deep in the sockets, no nose, no lips
    hp, HL, hd, up, side = pointer(V3(S['head'][0]), V3(S['head'][1]))
    cone('neck', sk, 'neck', V3(S['neck'][0]) + Vector((0, 0.04, -0.10)), V3(S['neck'][1]) + Vector((0, 0.03, 0)), 0.10, 0.085)
    ball('skull', sk, 'head', hp(0.10, 0.06), 0.27, sx=0.95, sy=1.05, sz=1.08, seg=12, rings=8)
    cone('face', sk, 'head', hp(0.18, -0.04), hp(0.42, -0.10), 0.20, 0.15, sx=0.9)
    for sg in (1, -1):
        ball('socket', C['dark'], 'head', hp(0.30, 0.06, sg * 0.105), 0.085, sy=0.7); ball('eye', C['eye'], 'head', hp(0.345, 0.055, sg * 0.105), 0.02); mark('eye.' + ('L' if sg > 0 else 'R'), hp(0.36, 0.055, sg * 0.105), 'head')
        cone('cheek', C['bone'], 'head', hp(0.30, -0.035, sg * 0.20), hp(0.40, -0.03, sg * 0.10), 0.03, 0.03, seg=4)
    cone('nosehole', C['dark'], 'head', hp(0.41, -0.01), hp(0.445, -0.07), 0.012, 0.05, seg=3)
    for k in range(7):
        x = (k - 3) * 0.038; cone('tup', C['tooth'], 'head', hp(0.42 - 0.012 * abs(k - 3), -0.115, x), hp(0.425 - 0.012 * abs(k - 3), -0.185, x), 0.019, 0.012, seg=4)
    jp, JL, jd, jup, jside = pointer(V3(S['jaw'][0]), V3(S['jaw'][1]))
    ball('mouth', C['mouth'], 'head', hp(0.30, -0.17), 0.13, sx=1.0, sy=1.2, sz=0.5)
    cone('jaw', sk, 'jaw', jp(0.0, -0.02), jp(JL * 0.95, 0.0), 0.14, 0.085, sy=0.45)
    for k in range(6): x = (k - 2.5) * 0.036; cone('tlo', C['tooth'], 'jaw', jp(JL * 0.86 - 0.012 * abs(k - 2.5), 0.025, x), jp(JL * 0.88 - 0.012 * abs(k - 2.5), 0.10, x), 0.018, 0.011, seg=4)
    ball('gore', C['blood'], 'jaw', jp(JL * 0.75, -0.06), 0.085, sy=1.1, sz=0.8); hang('drip', C['blood'], 'jaw', [jp(JL * 0.8, -0.08, k * 0.05) for k in (-1, 0.4, 1.2)], 0.24, 0.03, vary=0.5)
    hang('wisps', C['hair'], 'head', [hp(-0.08, 0.20, k * 0.10) for k in (-2, -1, 1, 2)] + [hp(-0.16, 0.10, k * 0.16) for k in (-1, 1)], 0.85, 0.035, lean=0.1)
    # the second: the hag, hung low on a long neck, hair to the ground, the jaw unhinged
    HS = S['heads']['L']; hp2, HL2, hd2, up2, side2 = pointer(HS['head'][0], HS['head'][1])
    cone('neckL', sk, 'neckL', Vector(HS['neck'][0]) - Vector((0.1, 0, 0.05)), Vector(HS['neck'][1]), 0.09, 0.07)
    for k in range(4): b = Vector(HS['neck'][0]).lerp(Vector(HS['neck'][1]), 0.2 + k * 0.2); ball('nvert', sk, 'neckL', b + Vector((0, 0.05, 0.06)), 0.04, seg=5, rings=4)
    ball('skullL', sk, 'headL', hp2(0.08, 0.05), 0.23, sx=0.9, sy=1.2, sz=1.0); cone('faceL', sk, 'headL', hp2(0.10, -0.02), hp2(0.40, -0.04), 0.18, 0.11)
    n0 = hp2(0.34, 0.03); cone('noseL', sk, 'headL', n0, n0 + hd2 * 0.26 - up2 * 0.16, 0.055, 0.012, seg=5)
    ball('eyeLw', C['white'], 'headL', hp2(0.27, 0.07, 0.09), 0.062); ball('eyeLp', C['eye'], 'headL', hp2(0.325, 0.07, 0.092), 0.022); mark('eye.L2', hp2(0.33, 0.07, 0.092), 'headL')
    ball('eyeLs', C['dark'], 'headL', hp2(0.28, 0.06, -0.09), 0.05, sy=0.5, sz=0.35)
    ball('mouthL', C['mouth'], 'headL', hp2(0.26, -0.16), 0.13, sx=0.9, sy=1.0, sz=1.5)
    jb = 'jawL'; bj, jd2, ju2, js2, JL3 = frame_of(hp2(0.08, -0.10), hp2(HL2 * 0.9, -0.16))
    cone('jawLm', sk, jb, hp2(0.06, -0.14), hp2(0.34, -0.36), 0.10, 0.055, sy=0.5)                                   # hanging open
    for sg in (1, -1): cone('tuskL', C['tooth'], jb, hp2(0.30, -0.32, sg * 0.05), hp2(0.36, -0.14, sg * 0.07), 0.024, 0.005, seg=4)
    hang('hairL', C['hair'], 'headL', [hp2(-0.10 + 0.07 * (i % 4), 0.20 - 0.02 * (i % 4), (i - 5.5) * 0.045) for i in range(12)], 1.25, 0.05, lean=0.06, flat=0.4)
    # the third: small, shrivelled, sewn shut, screaming
    HR = S['heads']['R']; hp3, HL3, hd3, up3, side3 = pointer(HR['head'][0], HR['head'][1])
    cone('neckR', sk, 'neckR', Vector(HR['neck'][0]) + Vector((0.08, 0, -0.05)), Vector(HR['neck'][1]), 0.075, 0.05)
    ball('skullR', sk, 'headR', hp3(0.10, 0.03), 0.17, sx=0.9, sy=1.1, sz=1.15)
    for sg in (1, -1):
        ball('lidR', C['shade'], 'headR', hp3(0.22, 0.05, sg * 0.07), 0.05, sy=0.5)
        for k in (-1, 0, 1): cone('stitch', C['dark'], 'headR', hp3(0.265, 0.085, sg * 0.07 + k * 0.025), hp3(0.265, 0.015, sg * 0.07 + k * 0.025 + 0.012), 0.008, 0.008, seg=3)
    ball('mouthR', C['dark'], 'headR', hp3(0.22, -0.09), 0.075, sx=0.8, sy=0.7, sz=1.25)
    ball('chinR', sk, 'jawR', hp3(0.16, -0.20), 0.07, sx=1.0, sy=1.0, sz=0.6)
    hang('hairR', C['hair'], 'headR', [hp3(-0.04, 0.16, k * 0.07) for k in (-1, 0, 1)], 0.3, 0.03, lean=0.3)
    for sd in ('L', 'R'):
        p = limb('a' + sd, sk, (0.10, 0.07, 0.055), knob=0.10)
        cone('gaunt' + sd, C['blood'], 'a' + sd + '_lo', p[1].lerp(p[2], 0.45), p[2], 0.068, 0.06)                           # blood to the elbows
        hand('a' + sd, C['blood'], C['bone'], 0.10, fingers=4, fl=0.40, fr=0.035, spread=1.0, curl=0.12)
        limb('l' + sd, sk, (0.14, 0.085, 0.07), knob=0.135); foot('l' + sd, sk, C['bone'], 0.13, toes=3, tl=0.24, tr=0.04)

def body_of(skin, top, legs, shoe, belly=1.0, bare=False, arm_r=(0.078, 0.064, 0.056), leg_r=(0.098, 0.078, 0.062)):
    """the shared figure: pelvis, waist, chest, neck, a big head, mitten hands, two-part limbs; returns the head's pointer"""
    cone('pelvis', legs, 'body', (0, 0.02, 0.72), (0, 0.02, 0.96), 0.17, 0.165 * belly, sx=1.15)
    cone('waist', top, 'spine', (0, 0.02, 0.93), (0, 0.01, 1.12), 0.165 * belly, 0.18, sx=1.2)
    cone('chest', top, 'chest', (0, 0.01, 1.08), (0, 0.0, 1.31), 0.19, 0.15, sx=1.35)
    cone('neck', skin, 'neck', (0, 0.0, 1.28), (0, 0.0, 1.40), 0.075, 0.07)
    hp, HL, hd, up, side = pointer(V3(S['head'][0]), V3(S['head'][1]))
    ball('head', skin, 'head', hp(0.0, 0.20), 0.225, sx=1.0, sy=1.0, sz=1.0, seg=12, rings=8)
    for sd in ('L', 'R'):
        limb('a' + sd, top, arm_r); hand('a' + sd, skin, skin, 0.066, fingers=0)
        limb('l' + sd, legs, leg_r); foot('l' + sd, skin if bare else shoe, skin if bare else shoe, 0.072, toes=3 if bare else 0, tl=0.05, tr=0.022)
    return hp, hd, up, side
def lyre(group, c, mat, strings, tilt=0.0):
    c = Vector(c); Rt = Matrix.Rotation(rad(tilt), 3, 'Y')
    P = lambda x, z, y=0.0: c + Rt @ Vector((x, y, z))
    ball('lyrebox', mat, group, P(0, -0.02), 0.11, sx=1.0, sy=0.28, sz=1.25, rot=Rt)
    for sg in (1, -1): cone('lyrearm', mat, group, P(sg * 0.085, 0.06), P(sg * 0.10, 0.30), 0.022, 0.018, seg=5)
    cone('lyreyoke', mat, group, P(-0.12, 0.30), P(0.12, 0.30), 0.02, 0.02, seg=5)
    for k in range(5): x = (k - 2) * 0.03; cone('lyrestring', strings, group, P(x * 0.6, -0.08, -0.035), P(x, 0.30, -0.02), 0.004, 0.004, seg=3)

def build_draugr():
    sk = C['skin']; hp, hd, up, side = body_of(sk, C['mail'], C['cloth'], C['cloth'], belly=1.28, bare=True, arm_r=(0.085, 0.07, 0.06))
    ball('gut', C['mail'], 'spine', (0, -0.05, 1.00), 0.21, sx=1.15, sy=1.0, sz=0.95)                                   # bloated under the mail
    hang('mailhem', C['mail'], 'body', [(math.sin(rad(a)) * 0.22, 0.02 + math.cos(rad(a)) * 0.20, 0.80) for a in range(0, 360, 30)], 0.20, 0.07, lean=0.2, flat=0.5, vary=0.6)
    hang('rags', C['cloth'], 'chest', [(math.sin(rad(a)) * 0.24, 0.03 + math.cos(rad(a)) * 0.15, 1.24) for a in (-60, -20, 30, 70, 150, 200)], 0.55, 0.07, lean=0.08, flat=0.3)   # what is left of a cloak
    hang('weed', C['kelp'], 'chest', [(0.22, -0.02, 1.30), (-0.20, 0.06, 1.30), (0.10, 0.12, 1.30), (-0.26, -0.04, 1.26)], 0.5, 0.05, lean=0.1, flat=0.3)
    for (x, y, z) in ((0.17, -0.13, 1.16), (0.20, -0.10, 1.08), (-0.19, -0.11, 0.94), (-0.05, 0.18, 1.12)): ball('barnacle', C['barnacle'], 'chest' if z > 1.05 else 'spine', (x, y, z), 0.03, sz=0.7, seg=6, rings=4)
    for (x, z) in ((0.08, 1.16), (-0.10, 1.02)): ball('rustspot', C['rust'], 'chest' if z > 1.05 else 'spine', (x, -0.19 if z > 1.05 else -0.25, z), 0.032, sy=0.3, seg=6, rings=4)
    ball('helm', C['rust'], 'head', hp(-0.02, 0.31), 0.235, sz=0.62, seg=12, rings=8); cone('helmrim', C['iron'], 'head', hp(-0.02, 0.285), hp(-0.02, 0.32), 0.24, 0.235, seg=12)
    cone('nasal', C['iron'], 'head', hp(0.215, 0.30), hp(0.238, 0.17), 0.028, 0.02, seg=4); cone('spike', C['iron'], 'head', hp(-0.02, 0.44), hp(-0.04, 0.53), 0.03, 0.006, seg=5)
    ball('socketL', C['dark'], 'head', hp(0.185, 0.215, 0.085), 0.05, sy=0.6); ball('socketR', C['dark'], 'head', hp(0.185, 0.215, -0.085), 0.05, sy=0.6)
    ball('eyeL', C['eye'], 'head', hp(0.205, 0.215, 0.085), 0.026); ball('eyeR', C['eye'], 'head', hp(0.20, 0.21, -0.085), 0.015)      # one staring, one sunk
    mark('eye.L', hp(0.215, 0.215, 0.085), 'head'); mark('eye.R', hp(0.21, 0.21, -0.085), 'head')
    ball('mouth', C['mouth'], 'head', hp(0.17, 0.085), 0.075, sx=1.1, sy=0.8, sz=0.7)
    jp, JL, jd, jup, jside = pointer(V3(S['jaw'][0]), V3(S['jaw'][1]))
    ball('jaw', sk, 'jaw', jp(0.10, -0.045), 0.10, sx=1.15, sy=1.1, sz=0.5)
    for k in (-1.5, -0.5, 0.5, 1.5): cone('tooth', C['tooth'], 'jaw', jp(0.17, -0.02, k * 0.035), jp(0.175, 0.03, k * 0.035), 0.014, 0.008, seg=4)
    hang('beard', C['beard'], 'jaw', [jp(0.13, -0.07, k * 0.05) for k in (-2, -1, 0, 1, 2)] + [jp(0.05, -0.06, k * 0.11) for k in (-1, 1)], 0.36, 0.05, lean=0.1)
    hang('beardweed', C['kelp'], 'jaw', [jp(0.14, -0.08, 0.07), jp(0.12, -0.08, -0.04)], 0.42, 0.03, flat=0.3)
    hang('hair', C['beard'], 'head', [hp(-0.12 + 0.03 * (i % 2), 0.20, (i - 2.5) * 0.08) for i in range(6)], 0.42, 0.045, lean=0.15)
    # the shield on the left forearm: rotten boards, a rusted boss, a bite out of the rim
    L = LIMBS['aL']; e, w = V3(L['J'][1], L['x']), V3(L['J'][2], L['x']); c0 = e.lerp(w, 0.55) + Vector((0.09, -0.02, 0)); Ry = Matrix.Rotation(rad(90), 3, 'Y')
    ball('shield', C['wood'], 'aL_lo', c0, 0.34, sx=1.0, sy=1.0, sz=0.10, rot=Ry, seg=12, rings=6); ball('boss', C['rust'], 'aL_lo', c0 + Vector((0.035, 0, 0)), 0.08, sx=0.6)
    for k in (-1, 0, 1): cone('board', C['dark'], 'aL_lo', c0 + Vector((0.04, k * 0.13, -0.30)), c0 + Vector((0.04, k * 0.13, 0.30)), 0.008, 0.008, seg=3)
    ball('bite', C['dark'], 'aL_lo', c0 + Vector((0.03, -0.24, 0.24)), 0.10, sx=0.25)
    # the sword in the right hand: pitted, the point forward and down
    L = LIMBS['aR']; w, t = V3(L['J'][2], L['x']), V3(L['J'][3], L['x']); m = w.lerp(t, 0.45); d = Vector((0, -0.92, -0.38)).normalized()
    cone('grip', C['wood'], 'aR_ft', m - d * 0.09, m + d * 0.07, 0.022, 0.022, seg=5); cone('guard', C['iron'], 'aR_ft', m + d * 0.07 + Vector((0.09, 0, 0)), m + d * 0.07 - Vector((0.09, 0, 0)), 0.02, 0.02, seg=4)
    cone('blade', C['iron'], 'aR_ft', m + d * 0.08, m + d * 0.80, 0.05, 0.012, seg=4, sy=0.25); ball('pommel', C['rust'], 'aR_ft', m - d * 0.10, 0.032)
    for k in (0.3, 0.52, 0.66): ball('pit', C['rust'], 'aR_ft', m + d * k + Vector((0, 0, 0.012)), 0.022, sx=0.4, seg=5, rings=4)

def build_huldra():
    sk = C['skin']; hp, hd, up, side = body_of(sk, C['dress'], C['dress'], C['shoe'], arm_r=(0.062, 0.05, 0.044), leg_r=(0.085, 0.066, 0.052))
    cone('skirt', C['dress'], 'body', (0, 0.02, 0.92), (0, 0.02, 0.09), 0.17, 0.33, seg=14, sx=1.1)
    cone('hem', C['trim'], 'body', (0, 0.02, 0.13), (0, 0.02, 0.09), 0.325, 0.335, seg=14, sx=1.1); cone('belt', C['trim'], 'spine', (0, 0.02, 0.94), (0, 0.02, 0.99), 0.178, 0.178, seg=12, sx=1.2)
    cone('neckline', C['trim'], 'chest', (0, 0.0, 1.27), (0, 0.0, 1.31), 0.165, 0.15, seg=12, sx=1.35)
    for sd in ('L', 'R'):
        L = LIMBS['a' + sd]; e, w = V3(L['J'][1], L['x']), V3(L['J'][2], L['x']); cone('cuff', C['trim'], 'a' + sd + '_lo', e.lerp(w, 0.86), w, 0.05, 0.05, seg=8)
    # the face
    for sg in (1, -1):
        ball('eye', C['eye'], 'head', hp(0.20, 0.215, sg * 0.08), 0.024, sz=1.25); cone('brow', C['bark'], 'head', hp(0.205, 0.278, sg * 0.045), hp(0.19, 0.262, sg * 0.12), 0.009, 0.005, seg=3)
        ball('cheek', C['lip'], 'head', hp(0.17, 0.155, sg * 0.12), 0.035, sy=0.3)
    ball('nose', sk, 'head', hp(0.225, 0.18), 0.025); ball('lips', C['lip'], 'head', hp(0.205, 0.115), 0.032, sx=1.3, sy=0.5, sz=0.5)
    # fair hair: a cap of it, two long locks falling in front over the shoulders (never down the back: the back is what she hides), a wreath of flowers
    ball('haircap', C['hair'], 'head', hp(-0.045, 0.225), 0.238, seg=12, rings=8)
    for sg in (1, -1):
        hang('lock', C['hair'], 'head', [hp(0.06, 0.22, sg * 0.20), hp(0.02, 0.20, sg * 0.225), hp(0.10, 0.18, sg * 0.17)], 0.74, 0.06, lean=0.02, vary=0.12)
    hang('nape', C['hair'], 'head', [hp(-0.20, 0.14, k * 0.07) for k in (-2, -1, 0, 1, 2)], 0.16, 0.06, vary=0.2)
    for i in range(10):
        a = rad(i * 36); ball('flower', C['flowerA'] if i % 2 else C['flowerB'], 'head', hp(-0.045 + 0.20 * math.cos(a), 0.37, 0.20 * math.sin(a)), 0.04, sz=0.7, seg=6, rings=4)
    # the back: bark from the shoulders to the hips, and in it the hollow, black with rot, a ragged rim, bracket fungus and moss
    ball('bark', C['bark'], 'spine', (0, 0.105, 1.07), 0.19, sx=1.22, sy=0.62, sz=1.55, seg=12, rings=8)
    ball('hollow', C['rot'], 'spine', (0, 0.205, 1.07), 0.125, sx=1.0, sy=0.30, sz=1.75, seg=10, rings=6)
    for i in range(14):
        a = rad(i * 360 / 14); x, z = math.cos(a) * 0.135, math.sin(a) * 0.235; b = Vector((x, 0.19, 1.07 + z))
        cone('rim', C['bark'], 'spine', b, b + Vector((x * 0.35, 0.06 + 0.04 * RNG.random(), z * 0.30)), 0.04, 0.006, seg=4)
    for (x, z, r) in ((0.17, 1.20, 0.07), (-0.18, 1.00, 0.08), (0.16, 0.90, 0.055)): ball('fungus', C['fungus'], 'spine', (x, 0.17, z), r, sy=0.9, sz=0.35, seg=7, rings=4)
    for (x, z, r) in ((-0.12, 1.30, 0.07), (0.05, 0.80, 0.08)): ball('moss', C['moss'], 'spine', (x, 0.19, z), r, sy=0.4, sz=0.6, seg=6, rings=4)
    for (x, z) in ((0.06, 1.36), (-0.10, 0.78)): cone('twig', C['bark'], 'spine', (x, 0.20, z), (x * 2.2, 0.36, z + 0.10), 0.014, 0.003, seg=3)
    for k in range(4): cone('grain', C['rot'], 'spine', (-0.15 + k * 0.10, 0.215 - 0.02 * abs(k - 1.5), 0.78), (-0.16 + k * 0.105, 0.215 - 0.02 * abs(k - 1.5), 0.70 - 0.02 * (k % 2)), 0.008, 0.004, seg=3)

def build_nacken():
    sk = C['skin']; hp, hd, up, side = body_of(sk, C['tunic'], C['trouser'], C['trouser'], bare=True, arm_r=(0.07, 0.056, 0.05), leg_r=(0.09, 0.07, 0.056))
    cone('tunichem', C['tunic'], 'body', (0, 0.02, 0.94), (0, 0.02, 0.66), 0.17, 0.22, seg=12, sx=1.15); cone('belt', C['belt'], 'spine', (0, 0.02, 0.93), (0, 0.02, 0.975), 0.182, 0.182, seg=12, sx=1.2)
    hang('tatters', C['tunic'], 'body', [(math.sin(rad(a)) * 0.24, 0.02 + math.cos(rad(a)) * 0.21, 0.68) for a in range(0, 360, 36)], 0.14, 0.06, lean=0.2, flat=0.4, vary=0.5)
    for (x, a) in ((0.16, 12), (0.20, -6), (0.13, 24)): cone('reed', C['reed'], 'spine', (x, 0.06, 0.92), (x + math.sin(rad(a)) * 0.2, 0.10, 1.50 + 0.08 * RNG.random()), 0.012, 0.004, seg=3)
    for sd in ('L', 'R'):
        L = LIMBS['a' + sd]; e, w = V3(L['J'][1], L['x']), V3(L['J'][2], L['x']); cone('wrist', sk, 'a' + sd + '_lo', e.lerp(w, 0.55), w, 0.052, 0.046, seg=8)      # sleeves to the elbow
        L = LIMBS['l' + sd]; k, a = V3(L['J'][1], L['x']), V3(L['J'][2], L['x']); cone('shin', sk, 'l' + sd + '_lo', k.lerp(a, 0.5), a, 0.066, 0.055, seg=8)          # trousers to the calf
    for sg in (1, -1):
        ball('eye', C['eye'], 'head', hp(0.20, 0.215, sg * 0.08), 0.028, sz=1.2); cone('brow', C['hair'], 'head', hp(0.205, 0.26, sg * 0.04), hp(0.19, 0.275, sg * 0.125), 0.012, 0.006, seg=3)
    ball('nose', sk, 'head', hp(0.225, 0.18), 0.026, sz=1.3); ball('lips', C['lip'], 'head', hp(0.208, 0.115), 0.03, sx=1.4, sy=0.5, sz=0.4)
    ball('haircap', C['hair'], 'head', hp(-0.04, 0.23), 0.238, seg=12, rings=8)                                         # long, dark and wet, hanging straight
    hang('hair', C['hair'], 'head', [hp(-0.04 + 0.21 * math.cos(rad(a)), 0.20, 0.215 * math.sin(rad(a))) for a in range(50, 311, 20)], 0.50, 0.055, lean=0.03, vary=0.2)
    hang('drip', C['lip'], 'head', [hp(-0.02, 0.05, 0.20), hp(-0.10, 0.02, -0.19)], 0.10, 0.012, vary=0.4)
    l0 = hp(0.02, 0.40, 0.12)                                                                                            # a water lily caught in his hair
    for i in range(6): a = rad(i * 60); ball('petal', C['lily'], 'head', l0 + Vector((math.cos(a) * 0.05, math.sin(a) * 0.05, 0.0)), 0.04, sz=0.5, seg=6, rings=4)
    ball('lilyheart', C['lilyc'], 'head', l0 + Vector((0, 0, 0.02)), 0.028)
    lyre('lyreA', (0, 0.20, 1.10), C['wood'], C['string'], tilt=20); cone('strap', C['belt'], 'chest', (0.20, -0.10, 1.26), (-0.16, 0.14, 0.98), 0.014, 0.014, seg=4)
    lyre('lyreB', (0.04, -0.20, 1.04), C['wood'], C['string'], tilt=-14)
    ball('rock', C['rock'], 'rock', (0, 0.10, 0.16), 0.34, sx=1.15, sy=1.0, sz=0.66, seg=9, rings=6); ball('rockmoss', C['moss'], 'rock', (0.14, 0.22, 0.30), 0.14, sz=0.4, seg=7, rings=4)

def build_bysen():
    sk = C['skin']; hp, hd, up, side = body_of(sk, C['coat'], C['trouser'], C['shoe'], belly=1.15, arm_r=(0.08, 0.066, 0.058))
    cone('coathem', C['coat'], 'body', (0, 0.02, 0.94), (0, 0.02, 0.62), 0.19, 0.24, seg=12, sx=1.15); cone('belt', C['shoe'], 'spine', (0, 0.02, 0.92), (0, 0.02, 0.975), 0.20, 0.20, seg=12, sx=1.2)
    for sg in (1, -1): ball('eye', C['eye'], 'head', hp(0.205, 0.225, sg * 0.075), 0.022); ball('brow', C['beard'], 'head', hp(0.20, 0.27, sg * 0.08), 0.04, sy=0.5, sz=0.5)
    ball('nose', C['nose'], 'head', hp(0.235, 0.185), 0.05)
    cone('cap', C['cap'], 'head', hp(-0.01, 0.30), hp(-0.06, 0.56), 0.215, 0.09, seg=10); cone('captip', C['cap'], 'head', hp(-0.06, 0.55), hp(-0.24, 0.50), 0.09, 0.02, seg=7); cone('capband', C['beard'], 'head', hp(-0.01, 0.285), hp(-0.01, 0.33), 0.232, 0.222, seg=10)
    jp, JL, jd, jup, jside = pointer(V3(S['jaw'][0]), V3(S['jaw'][1]))
    hang('beard', C['beard'], 'jaw', [jp(0.14, -0.03, k * 0.045) for k in (-3, -2, -1, 0, 1, 2, 3)] + [jp(0.06, -0.02, k * 0.15) for k in (-1, 1)], 0.46, 0.07, lean=0.12, vary=0.15)
    ball('moustache', C['beard'], 'head', hp(0.215, 0.125), 0.05, sx=2.0, sy=0.6, sz=0.6)
    hang('hair', C['beard'], 'head', [hp(-0.16, 0.20, k * 0.09) for k in (-2, -1, 0, 1, 2)], 0.22, 0.06, lean=0.2)
    L = LIMBS['aR']; w, t = V3(L['J'][2], L['x']), V3(L['J'][3], L['x']); m = w.lerp(t, 0.45); d = Vector((0, -0.75, 0.66)).normalized()     # the little axe
    cone('haft', C['wood'], 'aR_ft', m - d * 0.14, m + d * 0.52, 0.026, 0.022, seg=5); h0 = m + d * 0.46
    cone('axehead', C['iron'], 'aR_ft', h0, h0 + Vector((0, -0.22, -0.10)), 0.045, 0.11, seg=4, sx=0.3)
    # what he turns into: an old stump with spread roots, rings on its cut top, moss, and one red toadstool the colour of his cap
    cone('stump', C['bark'], 'stump', (0, 0, 0.0), (0, 0, 1.0), 0.68, 0.54, seg=11); cone('stumptop', C['ring'], 'stump', (0, 0, 1.0), (0, 0, 1.03), 0.52, 0.50, seg=11)
    for r in (0.36, 0.20): cone('rings', C['wood'], 'stump', (0.03, 0.02, 1.03), (0.03, 0.02, 1.04), r, r, seg=11)
    for i in range(6): a = rad(i * 60 + 15); cone('root', C['bark'], 'stump', (math.cos(a) * 0.54, math.sin(a) * 0.54, 0.30), (math.cos(a) * 1.10, math.sin(a) * 1.10, 0.02), 0.22, 0.06, seg=6)
    for i in range(7): a = rad(i * 51); cone('furrow', C['trouser'], 'stump', (math.cos(a) * 0.675, math.sin(a) * 0.675, 0.12), (math.cos(a) * 0.55, math.sin(a) * 0.55, 0.96), 0.02, 0.012, seg=3)
    for (x, y, z, r) in ((0.32, -0.34, 1.01, 0.22), (-0.44, -0.38, 0.46, 0.21), (0.46, 0.26, 0.28, 0.2)): ball('moss', C['moss'], 'stump', (x, y, z), r, sz=0.35, seg=7, rings=4)
    t0 = Vector((-0.26, -0.66, 0.30)); cone('toadstem', C['spot'], 'stump', t0 - Vector((0, 0, 0.26)), t0, 0.05, 0.04, seg=5); ball('toadcap', C['cap'], 'stump', t0, 0.14, sz=0.55, seg=8, rings=5)
    for (dx, dy) in ((0.05, -0.07), (-0.06, -0.04), (0.0, 0.06)): ball('toadspot', C['spot'], 'stump', t0 + Vector((dx, dy, 0.055)), 0.022, sz=0.5, seg=5, rings=3)

{'boulder': build_boulder, 'forest': build_forest, 'maw': build_maw, 'three': build_three, 'draugr': build_draugr, 'huldra': build_huldra, 'nacken': build_nacken, 'bysen': build_bysen}[KIND]()
HS = S.get('hs', 1.0)
if HS != 1.0:
    base = {'head': V3(S['head'][0]), 'jaw': V3(S['head'][0])}
    for hk, hs in S.get('heads', {}).items(): base['head' + hk] = Vector(hs['head'][0]); base['jaw' + hk] = Vector(hs['head'][0])
    for o in PARTS:
        g = o.vertex_groups[0].name
        if g in base:
            for v in o.data.vertices: v.co = base[g] + (v.co - base[g]) * HS
    MARKS[:] = [(nm, base[par] + (pt - base[par]) * HS, par) for (nm, pt, par) in MARKS]
if MARKS:
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT'); EB = arm_data.edit_bones
    for (nm, p, par) in MARKS: bone(nm, p + Vector((0, 0.04, 0)), p, par)
    bpy.ops.object.mode_set(mode='OBJECT'); rig['marks'] = ','.join(m[0] for m in MARKS)
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'
for o in PARTS:
    md = o.modifiers.new('rig', 'ARMATURE'); md.object = rig; o.parent = rig

# ---------------- posing ----------------
REST = {b.name: b.matrix_local.to_3x3() for b in arm_data.bones}
RX = lambda d: Matrix.Rotation(rad(d), 3, 'X'); RY = lambda d: Matrix.Rotation(rad(d), 3, 'Y'); RZ = lambda d: Matrix.Rotation(rad(d), 3, 'Z')
def set_rot(name, R3, frame):
    if name not in REST: return
    pb = rig.pose.bones[name]; B = REST[name]; pb.rotation_quaternion = (B.inverted() @ R3 @ B).to_quaternion(); pb.keyframe_insert('rotation_quaternion', frame=frame)
def about(piv, R3, loc=(0, 0, 0)):
    p = Vector(piv); return Matrix.Translation(Vector(loc)) @ Matrix.Translation(p) @ R3.to_4x4() @ Matrix.Translation(-p)
def solve(L, target, cannon, bend):
    l1, l2, l3 = L['len']; r1, r2, r3 = L['rest']; J = L['J'][0]
    ay = target[0] + math.sin(cannon) * l3; az = target[1] + math.cos(cannon) * l3
    dy, dz = ay - J[0], az - J[1]; d = math.hypot(dy, dz); d = max(abs(l1 - l2) + 0.004, min(l1 + l2 - 0.004, d))
    aJA = math.atan2(-dy, -dz); alpha = math.acos(max(-1, min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
    t1 = aJA + bend * alpha; ky, kz = J[0] - math.sin(t1) * l1, J[1] - math.cos(t1) * l1
    ey, ez = J[0] - math.sin(aJA) * d, J[1] - math.cos(aJA) * d
    t2 = math.atan2(-(ey - ky), -(ez - kz))
    return (t1 - r1, (t2 - r2) - (t1 - r1), (cannon - r3) - (t2 - r2))
def tri(v): return v if isinstance(v, (tuple, list)) else (v, 0.0, 0.0)
def R3of(v): p, y, r = (tuple(tri(v)) + (0.0, 0.0))[:3]; return RZ(y) @ RY(r) @ RX(p)
def pose(frame, P):
    """P: loc, pitch (front down), roll, yaw of the body; spine, chest, neck, head as a pitch or (pitch, yaw, roll); jaw (open);
    tail; headL, neckL, jawL, headR, neckR, jawR; limbs: {'lL': ('w', y, z, foot_deg)} a toe in the world, ('l', y, z, deg) in
    the parent's own space, or ('fk', swing, out, bend, round, wrist): swing forward, out to the side, the middle joint's
    bend, round the body's upright axis toward the front, and the last bone"""
    g = P.get; loc = Vector(g('loc', (0, 0, 0))); bp = g('pitch', 0.0)
    Rb = RZ(g('yaw', 0.0)) @ RY(g('roll', 0.0)) @ RX(bp)
    pb = rig.pose.bones['body']; pb.location = REST['body'].inverted() @ loc; pb.keyframe_insert('location', frame=frame); set_rot('body', Rb, frame)
    Mb = about(PIV['body'], Rb, loc); Rs = R3of(g('spine', 0.0)); Rc = R3of(g('chest', 0.0)); set_rot('spine', Rs, frame); set_rot('chest', Rc, frame)
    Mc = Mb @ about(PIV['spine'], Rs) @ about(PIV['chest'], Rc); pc = bp + tri(g('spine', 0.0))[0] + tri(g('chest', 0.0))[0]
    for nm in ('neck', 'head', 'neckL', 'headL', 'neckR', 'headR'): set_rot(nm, R3of(g(nm, 0.0)), frame)
    for nm in ('jaw', 'jawL', 'jawR'): set_rot(nm, RX(g(nm, 0.0)), frame)
    set_rot('tail', R3of(g('tail', 0.0)), frame)
    for bn, bdef in SBONES.items():                    # a thing that is there or not (a lyre in the lap, a rock, the stump he turns into)
        v = g('scale', {}).get(bn, bdef); pbs = rig.pose.bones[bn]; pbs.scale = (max(v, 0.0005),) * 3; pbs.keyframe_insert('scale', frame=frame)
    for n, L in LIMBS.items():
        leg = L['kind'] == 'l'; spec = g('limbs', {}).get(n) or (('w' if leg else 'l'), L['J'][3][0], L['J'][3][1], math.degrees(L['rest'][2]))
        if spec[0] == 'fk':
            sw, out, bend, rnd, wr = (tuple(spec[1:]) + (0.0, 0.0, 0.0, 0.0))[:5]; s = L['sgn']
            set_rot(n + '_up', RZ(-s * rnd) @ RX(-sw) @ RY(-s * out), frame); set_rot(n + '_lo', RX(-bend), frame); set_rot(n + '_ft', RX(-wr), frame); continue
        Mp, pp = (Mb, bp) if leg else (Mc, pc); bend = 1 if leg else -1
        if spec[0] == 'w':
            tl = Mp.inverted() @ Vector((L['x'], spec[1], spec[2])); d1, d2, d3 = solve(L, (tl.y, tl.z), rad(spec[3] + pp), bend)
        else: d1, d2, d3 = solve(L, (spec[1], spec[2]), rad(spec[3]), bend)
        for suffix, dd in (('_up', d1), ('_lo', d2), ('_ft', d3)): set_rot(n + suffix, RX(-math.degrees(dd)), frame)
def clip(name, length, fn):
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = length
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    for f in range(1, length + 1): pose(f, fn((f - 1) / length))
    return act

# ---------------- the clips ----------------
G = S['walk']; KN = S['knuckle']; THREE = KIND == 'three'; MAW = KIND == 'maw'
ease = lambda k: k * k * (3 - 2 * k)
sn = lambda p, f=1.0, o=0.0: math.sin(TAU * (p * f + o))
REST_FT = {n: math.degrees(L['rest'][2]) for n, L in LIMBS.items()}
def heads(p, calm=1.0, extra=None):
    """the two other heads never keep still and never look where the first one looks"""
    if not THREE: return {}
    d = {'neckL': (10 * sn(p, 1, 0.2) * calm, 14 * sn(p, 1, 0.55) * calm, 0), 'headL': (12 * sn(p, 2, 0.1) * calm, 16 * sn(p, 1, 0.8) * calm, 10 * sn(p, 1, 0.3)), 'jawL': 10 + 8 * sn(p, 2, 0.4),
         'neckR': (8 * sn(p, 2, 0.6), 18 * sn(p, 1, 0.1), 0), 'headR': (10 * sn(p, 3, 0.2), 22 * sn(p, 2, 0.35), 14 * sn(p, 3, 0.7)), 'jawR': 12 + 10 * sn(p, 3)}
    if extra: d.update(extra)
    return d
def step(n, u, yoff=0.0, S_=None, h_=None):
    L = LIMBS[n]; y0, z0 = L['J'][3]; Sx = S_ or G['S']; h = h_ or G['h']; b = G['beta']
    if u < b: k = u / b; return ('w', y0 + yoff - Sx / 2 + Sx * k, z0, REST_FT[n] - (16 * max(0.0, k - 0.75) / 0.25 if L['kind'] == 'l' else 0))
    k = (u - b) / (1 - b); e = ease(k); return ('w', y0 + yoff + Sx / 2 - Sx * e, z0 + h * math.sin(math.pi * k), REST_FT[n] + (-20 * math.sin(math.pi * k) if L['kind'] == 'l' else 12 * math.sin(math.pi * k)))
def idle(p):
    b = sn(p); d = {'loc': (0, 0, -0.015 + 0.015 * b), 'spine': 1.2 * b, 'chest': (1.5 * b, 2 * sn(p, 1, 0.25), 0), 'neck': (2 * b, 5 * sn(p, 1, 0.3), 0), 'head': (3 * sn(p, 1, 0.1), 7 * sn(p, 1, 0.4), 2 * sn(p, 2)), 'jaw': 5 + 4 * sn(p, 2, 0.2), 'tail': (0, 14 * sn(p, 2), 0)}
    if MAW: d.update({'head': (-7 - 5 * b, 0, 2 * sn(p, 1, 0.3)), 'jaw': 6 * sn(p, 2), 'neck': 0})
    if not KN: d['limbs'] = {'aL': ('fk', 3 + 2 * b, 4, 6 + 3 * b, 0, 8 * sn(p, 2, 0.3)), 'aR': ('fk', 2 - 2 * b, 4, 6 - 3 * b, 0, 8 * sn(p, 2, 0.7))}
    d.update(heads(p)); return d
def walk(p):
    lim = {'lL': step('lL', p % 1.0), 'lR': step('lR', (p + 0.5) % 1.0)}
    if KN: lim['aL'] = step('aL', (p + 0.55) % 1.0, S_=G['S'] * 1.25, h_=G['h'] * 1.3); lim['aR'] = step('aR', (p + 0.05) % 1.0, S_=G['S'] * 1.25, h_=G['h'] * 1.3)
    else: lim['aL'] = ('fk', 16 * sn(p, 1, 0.5), 5, 12 + 8 * sn(p, 1, 0.4), 0, 10); lim['aR'] = ('fk', 16 * sn(p), 5, 12 + 8 * sn(p, 1, 0.9), 0, 10)
    d = {'loc': (0.04 * sn(p, 1, 0.1), 0, -G['bob'] + G['bob'] * math.cos(2 * TAU * p)), 'roll': G['sway'] * sn(p, 1, 0.1), 'pitch': 2 + 1.5 * sn(p, 2), 'spine': (1, -4 * sn(p), 0), 'chest': (1, -5 * sn(p), -G['sway'] * 0.6 * sn(p, 1, 0.1)),
         'neck': (3 * sn(p, 2, 0.1), 0, 0), 'head': (3 * sn(p, 2, 0.3), 4 * sn(p), 0), 'jaw': 5 + 3 * sn(p, 2), 'tail': (0, 16 * sn(p), 0), 'limbs': lim}
    if MAW: d.update({'head': (-9 + 4 * sn(p, 2), 0, 3 * sn(p)), 'neck': 0, 'jaw': 0, 'chest': (0, 0, 0), 'spine': 0})
    d.update(heads(p, 1.2)); return d
# the sweep: the right arm drawn far back and up while the whole body winds to the right, then round and across at arm's length
def sweep_pose(k, a):
    """k: 0 at rest .. 1 fully wound; a: 0 .. 1 through the blow (the arm at the far left at 1)"""
    w = k * (1 - a); yaw = -44 * w + 62 * a * k
    lim = {'aR': ('fk', 20 * w + 30 * a * k, 78 * k + 14 * a * k, 34 * w + 6, -36 * w + 58 * a * k, -10 * w), 'aL': ('fk', 24 * w - 18 * a * k, 16 * k, 28 * k, 0, 0) if not KN else None}
    if lim['aL'] is None: del lim['aL']
    return {'loc': (-0.06 * w + 0.10 * a * k, 0.08 * w - 0.22 * a * k, -0.05 * k), 'pitch': -5 * w + 14 * a * k, 'roll': -5 * w + 7 * a * k, 'spine': (-3 * w + 8 * a * k, yaw * 0.40, 0), 'chest': (-4 * w + 8 * a * k, yaw * 0.60, -6 * w + 8 * a * k),
            'neck': (-4 * w, -yaw * 0.35, 0), 'head': (-6 * w + 6 * a * k, -yaw * 0.25, 0), 'jaw': 8 + 22 * k, 'tail': (0, -20 * w + 26 * a * k, 0), 'limbs': lim}
def windup(p):
    if MAW:                                         # it sits back on its haunches and the lid comes all the way up
        k = ease(min(1.0, p * 1.35)); t = 2.5 * sn(p, 5) * k
        return {'loc': (0, 0.20 * k, 0.04 * k), 'pitch': -12 * k, 'head': (-46 * k + t, 0, 0), 'jaw': -10 * k, 'tail': (0, 12 * sn(p, 3), 0),
                'limbs': {'aL': ('fk', 26 * k, 34 * k, 18 * k, 0, -20 * k), 'aR': ('fk', 26 * k, 34 * k, 18 * k, 0, -20 * k)}}
    k = ease(min(1.0, p * 1.25)); d = sweep_pose(k, 0.0); t = 1.5 * sn(p, 4) * k; d['chest'] = (d['chest'][0] + t, d['chest'][1], d['chest'][2])
    d.update(heads(p, 0.5, {'jawL': 26 * k, 'headR': (-20 * k + 8 * sn(p, 5), 20 * sn(p, 4), 16 * sn(p, 6)), 'jawR': 24})); return d
def attack(p):
    if MAW:                                         # the lunge, and the lid slammed down on it; the hooks rake in from both sides
        a = min(1.0, p / 0.38); a = a * a; back = ease(max(0.0, (p - 0.55) / 0.45)); op = (1 - min(1.0, max(0.0, (p - 0.26) / 0.14))) * (1 - back) if p < 0.55 else 0.0; g = (1 - a) + 0.0
        fw = a * (1 - back)
        return {'loc': (0, 0.20 * (1 - a) - 0.55 * fw, 0.04 * (1 - a) - 0.05 * fw), 'pitch': -12 * (1 - a) + 9 * fw, 'head': (-46 * op - 7 * back, 0, 0), 'jaw': -10 * op, 'tail': (0, 0, 0),
                'limbs': {'aL': ('fk', 26 + 30 * fw, 34 * (1 - a) - 18 * fw, 18 + 20 * fw, 30 * fw, -20), 'aR': ('fk', 26 + 30 * fw, 34 * (1 - a) - 18 * fw, 18 + 20 * fw, 30 * fw, -20)}}
    a = min(1.0, p / 0.50); a = ease(a) ** 0.8; back = ease(max(0.0, (p - 0.62) / 0.38)); d = sweep_pose(1.0 - 0.55 * back, a * (1 - 0.5 * back))
    d.update(heads(p, 0.6, {'jawL': 30, 'jawR': 26})); return d
def hit(p):
    k = math.sin(math.pi * p); d = {'loc': (0, 0.10 * k, -0.03 * k), 'pitch': -9 * k, 'spine': -5 * k, 'chest': (-7 * k, 8 * k, 0), 'neck': (-10 * k, 0, 0), 'head': (-12 * k, 14 * k, 8 * k), 'jaw': 8 + 24 * k, 'tail': (0, 20 * k, 0)}
    if MAW: d.update({'head': (-7 - 20 * k, 0, 6 * k), 'jaw': 0, 'neck': 0})
    if not KN: d['limbs'] = {'aL': ('fk', -14 * k, 20 * k, 20 * k, 0, 0), 'aR': ('fk', -10 * k, 24 * k, 24 * k, 0, 0)}
    d.update(heads(p, 1.5, {'jawL': 34 * k + 10, 'jawR': 30})); return d
def shield(p):                                      # the fire: an arm thrown up before the eyes, the head turned away, a step back
    k = ease(min(1.0, p * 2.2)); t = sn(p, 3) * 2 * k
    d = {'loc': (0, 0.14 * k, -0.03 * k), 'pitch': -8 * k, 'spine': (-4 * k, 10 * k, 0), 'chest': (-5 * k + t, 16 * k, 0), 'neck': (4 * k, 18 * k, 0), 'head': (10 * k, 26 * k, 8 * k), 'jaw': 6 + 10 * k,
         'limbs': {'aL': ('fk', 96 * k, 12 * k, 100 * k, 18 * k, 30 * k)}}
    if not KN: d['limbs']['aR'] = ('fk', -12 * k, 14 * k, 20 * k, 0, 0)
    if MAW: d.update({'head': (4 * k, 0, 0), 'neck': 0, 'jaw': 0, 'chest': (0, 14 * k, 0)}); d['limbs'] = {'aL': ('fk', 70 * k, 30 * k, 60 * k, 40 * k, 0), 'aR': ('fk', 70 * k, 30 * k, 60 * k, 40 * k, 0)}
    d.update(heads(p, 1.4)); return d
def death(p):
    """it sways, the knees go, and it comes down on its face"""
    st = math.sin(math.pi * min(1.0, p / 0.35)) * (1 - min(1.0, p / 0.5)); f = ease(min(1.0, max(0.0, (p - 0.22) / 0.55))); land = ease(min(1.0, max(0.0, (p - 0.55) / 0.3)))
    lie = S['lie']; settle = 0.03 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.80) / 0.2)))
    lim = {}
    for n, L in LIMBS.items():
        if L['kind'] == 'l': lim[n] = ('fk', -62 * land - 10 * f * (1 - land), 6 * f, -30 * f * (1 - land) - 8 * land, 0, -40 * land) if f > 0.02 else None
        else: lim[n] = ('fk', (40 + (12 if n == 'aL' else -8)) * f + 46 * land, 22 * f, 20 * f * (1 - land) + 10, 0, 0) if (f > 0.02 or not KN) else None
        if lim[n] is None: del lim[n]
    d = {'loc': (0.05 * st, 0.10 * st - 0.75 * lie * land, -lie * f * 0.55 - lie * land * 0.45 + settle), 'pitch': -5 * st + 82 * land + 8 * f * (1 - land), 'roll': 5 * st + 6 * land, 'spine': 6 * f, 'chest': (8 * f, -8 * land, 0),
         'neck': (-16 * land + 10 * f, 16 * land, 0), 'head': (-20 * land + 12 * f, 30 * land, 0), 'jaw': 8 + 26 * f, 'tail': (20 * f, 10 * st, 0), 'limbs': lim}
    if MAW: d.update({'pitch': -4 * st + 6 * f, 'roll': 4 * st, 'loc': (0.05 * st, 0.08 * st, -lie * f + settle), 'head': (-30 * st * 1.2 - 16 * f, 0, 6 * f), 'neck': 0, 'jaw': 0, 'spine': 0, 'chest': (0, 0, 0)})
    if MAW: d['limbs'] = {n: ('fk', 30 * f, 46 * f, 10, 0, 0) for n in ('aL', 'aR')} if f > 0.02 else {}
    k = 1 - f; d.update(heads(p, 2.0 * k, {'neckL': (26 * f + 10 * k * sn(p, 3), 10 * k * sn(p, 2), 0), 'headL': (20 * f, 0, 20 * f), 'jawL': 34, 'neckR': (-30 * f, 20 * k * sn(p, 4), 0), 'headR': (-24 * f + 14 * k * sn(p, 5), 22 * k * sn(p, 4), 0), 'jawR': 30 * k})); return d

PERSON = S.get('person', False); SL = S.get('slump', 0.0)
def p_idle(p):
    b = sn(p); d = {'loc': (0.01 * SL * sn(p, 1, 0.3), 0, -0.008 + 0.008 * b), 'pitch': 5 * SL, 'spine': (1 * b + 6 * SL, 0, 3 * SL * sn(p, 1, 0.2)), 'chest': (1.2 * b + 5 * SL, 2 * sn(p, 1, 0.25), 0),
         'neck': (6 * SL, 4 * sn(p, 1, 0.3), 0), 'head': (2 * sn(p, 1, 0.1) + 10 * SL, 6 * sn(p, 1, 0.4), 8 * SL + 2 * sn(p, 2)), 'jaw': 14 * SL + 3 * SL * sn(p, 2),
         'limbs': {'aL': ('fk', 3 + 2 * b, 5, 8 + 3 * b + 30 * SL, 0, 6), 'aR': ('fk', 2 - 2 * b, 5 + 4 * SL, 8 - 3 * b, 0, 6)}}
    return d
def p_walk(p):
    lim = {'lL': step('lL', p % 1.0), 'lR': step('lR', (p + 0.5) % 1.0, yoff=0.06 * SL)}
    A = 22 * (1 - 0.6 * SL); lim['aL'] = ('fk', A * sn(p, 1, 0.5) + 6, 5, 14 + 8 * sn(p, 1, 0.4) + 30 * SL, 0, 6); lim['aR'] = ('fk', A * sn(p) + 4, 5 + 5 * SL, 14 + 8 * sn(p, 1, 0.9), 0, 6)
    return {'loc': (0.02 * sn(p, 1, 0.1) * (1 + 2 * SL), 0, -G['bob'] + G['bob'] * math.cos(2 * TAU * p)), 'roll': G['sway'] * sn(p, 1, 0.1), 'pitch': 3 + 5 * SL, 'spine': (1 + 5 * SL, -4 * sn(p), 0), 'chest': (1 + 4 * SL, -5 * sn(p), -G['sway'] * 0.5 * sn(p, 1, 0.1)),
            'neck': (4 * SL, 0, 0), 'head': (2 * sn(p, 2, 0.3) + 8 * SL, 3 * sn(p), 8 * SL), 'jaw': 14 * SL, 'limbs': lim}
def p_hit(p):
    k = math.sin(math.pi * p)
    return {'loc': (0, 0.08 * k, -0.02 * k), 'pitch': -8 * k, 'spine': -5 * k, 'chest': (-7 * k, 10 * k, 0), 'neck': (-8 * k, 0, 0), 'head': (-12 * k, 14 * k, 8 * k), 'jaw': 20 * k,
            'limbs': {'aL': ('fk', -16 * k, 22 * k, 24 * k + 30 * SL, 0, 0), 'aR': ('fk', -12 * k, 26 * k, 26 * k, 0, 0)}}
def call(p):                                        # the huldra beckons: one hand lifted and turned, the head tilted, the weight on one hip
    k = ease(min(1.0, p * 3)) * ease(min(1.0, (1 - p) * 3)); w = sn(p, 3)
    return {'loc': (0.02 * k, 0, 0), 'roll': 3 * k, 'spine': (0, 0, -3 * k), 'chest': (-2 * k, 4 * k, -3 * k), 'neck': (0, -6 * k, 0), 'head': (-4 * k, -8 * k, 10 * k),
            'limbs': {'aR': ('fk', 62 * k, 18 * k, 70 * k + 14 * w * k, 20 * k, 30 * w * k), 'aL': ('fk', 4, 8 + 6 * k, 14, 0, 6)}}
def play(p):                                        # Nacken on his stone with the lyre in his lap: one hand holds it, the other plucks, he sways with the tune
    b = sn(p); pl = sn(p, 6); sw = sn(p, 1, 0.1)
    return {'loc': (0, 0.06, -0.40), 'pitch': 2, 'spine': (6 + 1.5 * b, 0, 3 * sw), 'chest': (6, 3 * sw, 2 * sw), 'neck': (6, 0, 0), 'head': (12 + 3 * b, -8 + 6 * sw, 8 * sw),
            'scale': {'lyreA': 0.0, 'lyreB': 1.0, 'rock': 1.0},
            'limbs': {'lL': ('fk', 84, 9, -88, 0, 6), 'lR': ('fk', 74, 9, -62, 0, -8), 'aL': ('fk', 34, 6, 96, 22, 0), 'aR': ('fk', 30 + 4 * pl, 10, 92 + 10 * pl, 28, 14 * pl)}}
def chop(p):                                        # the bysen at his tree: the little axe up over the shoulder and down, slowly
    u = p / 0.55 if p < 0.55 else 1 - (p - 0.55) / 0.45; up_ = ease(max(0.0, min(1.0, u))); dn = 1 - up_
    return {'loc': (0, -0.03 * dn, -0.03 * dn), 'pitch': -6 * up_ + 14 * dn, 'spine': (-4 * up_ + 8 * dn, -12 * up_ + 6 * dn, 0), 'chest': (-6 * up_ + 8 * dn, -16 * up_ + 8 * dn, 0), 'head': (4 * dn - 6 * up_, 0, 0),
            'limbs': {'aR': ('fk', 30 + 110 * up_, 10, 30 + 60 * up_, 0, 20 * up_ - 30 * dn), 'aL': ('fk', 34 + 80 * up_, 4, 44 + 40 * up_, 26, 0)}}
def hide(p):                                        # he folds down small and the stump stands where he stood
    k = ease(min(1.0, p / 0.55)); g = ease(min(1.0, max(0.0, (p - 0.35) / 0.65)))
    return {'loc': (0, 0, -0.70 * k), 'pitch': 26 * k, 'spine': 20 * k, 'chest': 16 * k, 'head': 22 * k, 'scale': {'body': 1.0 - 0.999 * g, 'stump': g * (1.0 + 0.12 * math.sin(math.pi * g))},
            'limbs': {'aL': ('fk', 40 * k, 0, 90 * k, 0, 0), 'aR': ('fk', 40 * k, 0, 90 * k, 0, 0), 'lL': ('fk', 60 * k, 8, -110 * k, 0, 40 * k), 'lR': ('fk', 60 * k, 8, -110 * k, 0, 40 * k)}}
def stump(p): return {'scale': {'body': 0.0, 'stump': 1.0}}
ALL = {'idle': (48, p_idle if PERSON else idle), 'walk': (32 if PERSON else 40, p_walk if PERSON else walk), 'windup': (24 if PERSON else 36, windup), 'attack': (20 if PERSON else 28, attack), 'hit': (10, p_hit if PERSON else hit),
       'shield': (16, shield), 'death': (32 if PERSON else 40, death), 'call': (40, call), 'play': (48, play), 'chop': (40, chop), 'hide': (16, hide), 'stump': (2, stump)}
for cn in S.get('clips', ['idle', 'walk', 'windup', 'attack', 'hit', 'shield', 'death']): clip(cn, ALL[cn][0], ALL[cn][1])
if S.get('size'): rig.scale = (S['size'],) * 3
ad = rig.animation_data; ad.action = bpy.data.actions['idle']
if hasattr(ad, 'action_slot') and len(ad.action.slots): ad.action_slot = ad.action.slots[0]
sc.frame_set(1)
os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, 'parts', len(PARTS), 'marks', [m[0] for m in MARKS], 'actions', sorted(a.name for a in bpy.data.actions))
