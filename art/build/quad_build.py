"""The four-legged animals, modelled, rigged and animated by script (2026-10-11, Robin: the animals as Blender models, boar, deer,
wolf first; no Mixamo for quadrupeds, so the rig and the clips are made here).   node tools/blender.js art/build/quad_build.py -- boar

One rig for every species: body (the whole animal: bob, pitch, roll), hips and chest (the spine flexes between them), neck, head,
tail, and four legs of three bones each (upper, lower, cannon). The animal faces -Y, up is Z, its left is +X. A species is a SPEC:
the joints of a hind and a front leg in the side view (y, z), the torso as rings along the spine, the head and neck, and its
colours. The torso is one lofted mesh weighted between hips and chest by where a ring lies; everything else is rigid parts on one
bone each.

The clips are baked on every frame from small functions of the phase, not keyed by hand pose by pose: a foot follows a path
(planted and sliding back through the stance, lifted and carried forward through the swing) and a two-bone solver in the leg's
own plane finds the upper and lower leg, so feet stay on the ground whatever the body does (a crouch, a pitch, a bob). A rotation
about a world axis becomes a bone's own rotation by conjugating with its rest matrix, so no axis is guessed.
Clips: idle, walk, run, windup, attack, hit, death (a deer has no windup or attack). Saves art/source/<species>.blend."""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
NAME = argv[0] if argv else 'boar'
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source'); OUT = os.path.abspath(os.path.join(SRC, NAME + '.blend'))
FPS = 24
rad = math.radians

# ---------------- the species ----------------
# legs: hip, knee, ankle, hoof in the side view as (y, z); x is the leg's distance from the middle. torso: rings (y, zc, rx, rz).
SPECS = {
    'boar': {
        'hind': [(0.42, 0.54), (0.33, 0.33), (0.47, 0.17), (0.45, 0.025)], 'hx': 0.13, 'front': [(-0.30, 0.50), (-0.25, 0.30), (-0.28, 0.14), (-0.29, 0.025)], 'fx': 0.15,
        'torso': [(0.68, 0.56, 0.03, 0.04), (0.62, 0.57, 0.14, 0.16), (0.46, 0.59, 0.21, 0.22), (0.20, 0.61, 0.24, 0.25), (-0.08, 0.66, 0.26, 0.30), (-0.30, 0.67, 0.25, 0.31), (-0.46, 0.63, 0.21, 0.26), (-0.56, 0.59, 0.14, 0.17)],
        'piv': {'body': (0, 0.05, 0.60), 'hips': (0, 0.16, 0.60), 'chest': (0, -0.04, 0.62)},
        'neck': [(-0.44, 0.60), (-0.60, 0.53)], 'head': [(-0.60, 0.53), (-0.98, 0.37)], 'tail': [(0.67, 0.58), (0.76, 0.40)],
        'col': {'body': '#a07c5c', 'belly': '#66503c', 'leg': '#66503c', 'hoof': '#1f1a17', 'snout': '#b8968a', 'tusk': '#f6edd8', 'mane': '#3a2f29', 'eye': '#120e0c', 'ear': '#6e5b4d'},   # bright bases: a flank facing the camera takes the cel's shadow tone
        'leg_r': (0.085, 0.06, 0.04, 0.032),
    },
    'deer': {
        'hind': [(0.52, 0.94), (0.41, 0.66), (0.60, 0.40), (0.56, 0.025)], 'hx': 0.11, 'front': [(-0.42, 0.88), (-0.36, 0.62), (-0.38, 0.32), (-0.40, 0.025)], 'fx': 0.10,
        'torso': [(0.76, 0.99, 0.03, 0.04), (0.70, 0.99, 0.13, 0.15), (0.50, 1.00, 0.19, 0.21), (0.15, 0.98, 0.19, 0.22), (-0.20, 0.97, 0.20, 0.25), (-0.44, 0.99, 0.19, 0.25), (-0.58, 1.02, 0.14, 0.18), (-0.66, 1.05, 0.08, 0.11)],
        'piv': {'body': (0, 0.05, 0.98), 'hips': (0, 0.20, 0.98), 'chest': (0, -0.10, 0.98)},
        'neck': [(-0.56, 1.06), (-0.80, 1.46)], 'head': [(-0.80, 1.46), (-1.10, 1.36)], 'tail': [(0.75, 1.00), (0.82, 0.86)],
        'col': {'body': '#c98248', 'belly': '#ead8b6', 'leg': '#a96d40', 'hoof': '#2a211c', 'snout': '#2a211c', 'tusk': '#d9c8a4', 'mane': '#f0e6cf', 'eye': '#120e0c', 'ear': '#d19a6c'},
        'leg_r': (0.075, 0.045, 0.026, 0.022),
    },
    'wolf': {
        'hind': [(0.40, 0.68), (0.30, 0.46), (0.46, 0.25), (0.42, 0.03)], 'hx': 0.09, 'front': [(-0.33, 0.64), (-0.28, 0.42), (-0.30, 0.20), (-0.32, 0.03)], 'fx': 0.10,
        'torso': [(0.58, 0.71, 0.03, 0.04), (0.52, 0.71, 0.11, 0.12), (0.36, 0.71, 0.14, 0.15), (0.10, 0.69, 0.14, 0.15), (-0.15, 0.68, 0.16, 0.20), (-0.35, 0.70, 0.16, 0.21), (-0.48, 0.73, 0.12, 0.15), (-0.55, 0.76, 0.07, 0.09)],
        'piv': {'body': (0, 0.03, 0.70), 'hips': (0, 0.14, 0.70), 'chest': (0, -0.08, 0.70)},
        'neck': [(-0.44, 0.76), (-0.62, 0.92)], 'head': [(-0.62, 0.92), (-0.93, 0.85)], 'tail': [(0.56, 0.72), (0.86, 0.42)],
        'col': {'body': '#b5ac9c', 'belly': '#ded6c6', 'leg': '#cbc3b3', 'hoof': '#4a433c', 'snout': '#1f1a17', 'tusk': '#f0ead8', 'mane': '#7c7468', 'eye': '#e2b338', 'ear': '#8f8779'},
        'leg_r': (0.07, 0.045, 0.03, 0.03),
    },
    # the brown bear: heavy, a hump over the shoulders, a dished face, flat paws; it rears to strike
    'bear': {
        'hind': [(0.55, 0.80), (0.42, 0.50), (0.60, 0.22), (0.52, 0.035)], 'hx': 0.20, 'front': [(-0.45, 0.78), (-0.38, 0.48), (-0.42, 0.20), (-0.46, 0.035)], 'fx': 0.22,
        'torso': [(0.86, 0.82, 0.05, 0.06), (0.78, 0.84, 0.24, 0.26), (0.55, 0.88, 0.33, 0.34), (0.20, 0.90, 0.35, 0.36), (-0.15, 0.95, 0.36, 0.40), (-0.45, 0.99, 0.34, 0.41), (-0.65, 0.92, 0.27, 0.31), (-0.76, 0.86, 0.18, 0.21)],
        'piv': {'body': (0, 0.05, 0.88), 'hips': (0, 0.22, 0.88), 'chest': (0, -0.08, 0.90)},
        'neck': [(-0.62, 0.90), (-0.86, 0.84)], 'head': [(-0.86, 0.84), (-1.26, 0.70)], 'tail': [(0.84, 0.86), (0.91, 0.78)],
        'col': {'body': '#a8754a', 'belly': '#855a38', 'leg': '#7d5434', 'hoof': '#2a211c', 'snout': '#d9b88c', 'tusk': '#efe6d2', 'mane': '#8f6240', 'eye': '#120e0c', 'ear': '#8f6240'},
        'leg_r': (0.17, 0.115, 0.09, 0.085),
    },
    # the bull moose: tall on pale legs, a hump, a drooping nose, a bell under the chin, palmate antlers; it lowers them and gores
    'moose': {
        'hind': [(0.80, 1.55), (0.66, 1.10), (0.92, 0.66), (0.86, 0.035)], 'hx': 0.17, 'front': [(-0.62, 1.50), (-0.54, 1.08), (-0.57, 0.55), (-0.60, 0.035)], 'fx': 0.16,
        'torso': [(1.10, 1.62, 0.05, 0.06), (1.02, 1.62, 0.20, 0.24), (0.75, 1.64, 0.34, 0.37), (0.30, 1.62, 0.36, 0.41), (-0.20, 1.68, 0.37, 0.47), (-0.58, 1.78, 0.35, 0.51), (-0.82, 1.72, 0.25, 0.35), (-0.94, 1.70, 0.13, 0.18)],
        'piv': {'body': (0, 0.08, 1.66), 'hips': (0, 0.32, 1.66), 'chest': (0, -0.15, 1.68)},
        'neck': [(-0.80, 1.74), (-1.16, 1.96)], 'head': [(-1.16, 1.96), (-1.78, 1.72)], 'tail': [(1.08, 1.64), (1.13, 1.52)],
        'col': {'body': '#a67c56', 'belly': '#7a5a40', 'leg': '#d6c8ae', 'hoof': '#2a211c', 'snout': '#7d5c48', 'tusk': '#d9c7a0', 'mane': '#6e5040', 'eye': '#120e0c', 'ear': '#8a6650'},
        'leg_r': (0.16, 0.095, 0.058, 0.05),
    },
    # the goat (the studio, 2026-10-20): light and leggy, a short upturned tail, backswept horns, a beard, a bar of an eye; it grazes the yard and butts
    'goat': {
        'hind': [(0.40, 0.66), (0.32, 0.44), (0.44, 0.22), (0.42, 0.025)], 'hx': 0.09, 'front': [(-0.30, 0.64), (-0.26, 0.42), (-0.28, 0.20), (-0.29, 0.025)], 'fx': 0.09,
        'torso': [(0.54, 0.70, 0.03, 0.04), (0.48, 0.70, 0.12, 0.14), (0.32, 0.71, 0.16, 0.19), (0.08, 0.70, 0.17, 0.21), (-0.16, 0.71, 0.17, 0.21), (-0.34, 0.73, 0.15, 0.19), (-0.46, 0.75, 0.11, 0.14)],
        'piv': {'body': (0, 0.04, 0.70), 'hips': (0, 0.14, 0.70), 'chest': (0, -0.06, 0.71)},
        'neck': [(-0.44, 0.78), (-0.62, 0.98)], 'head': [(-0.62, 0.98), (-0.84, 0.92)], 'tail': [(0.52, 0.76), (0.58, 0.90)],
        'col': {'body': '#b4a386', 'belly': '#d6ccb6', 'leg': '#8a7a62', 'hoof': '#2a211c', 'snout': '#4a3e34', 'tusk': '#6a5a48', 'mane': '#5a4a3a', 'eye': '#c9a24a', 'ear': '#a08c70'},
        'leg_r': (0.055, 0.036, 0.024, 0.02),
    },
    # the sheep: a woolly barrel on thin dark legs, a dark face, ears out sideways, a short tail down; it grazes and lies in the paddock
    'sheep': {
        'hind': [(0.36, 0.56), (0.28, 0.38), (0.40, 0.19), (0.38, 0.025)], 'hx': 0.10, 'front': [(-0.28, 0.54), (-0.24, 0.36), (-0.26, 0.17), (-0.27, 0.025)], 'fx': 0.10,
        'torso': [(0.50, 0.62, 0.05, 0.06), (0.46, 0.64, 0.20, 0.22), (0.30, 0.66, 0.26, 0.28), (0.06, 0.66, 0.27, 0.30), (-0.18, 0.66, 0.26, 0.30), (-0.36, 0.66, 0.22, 0.26), (-0.46, 0.66, 0.15, 0.18)],
        'piv': {'body': (0, 0.03, 0.64), 'hips': (0, 0.12, 0.64), 'chest': (0, -0.06, 0.64)},
        'neck': [(-0.44, 0.70), (-0.60, 0.80)], 'head': [(-0.60, 0.80), (-0.80, 0.74)], 'tail': [(0.49, 0.62), (0.52, 0.50)],
        'col': {'body': '#e6dfcf', 'belly': '#d8d0bc', 'leg': '#3a3330', 'hoof': '#1f1a17', 'snout': '#2e2a28', 'tusk': '#cfc6b4', 'mane': '#efe8d8', 'eye': '#120e0c', 'ear': '#3a3330'},
        'leg_r': (0.05, 0.034, 0.022, 0.02),
    },
    # the cow: long and heavy on short legs, a straight back, a long head with short curved horns, a hanging tail with a tuft, an udder; she grazes and lies in the byre
    'cow': {
        'hind': [(0.72, 1.06), (0.60, 0.72), (0.78, 0.38), (0.74, 0.03)], 'hx': 0.18, 'front': [(-0.58, 1.02), (-0.50, 0.70), (-0.54, 0.36), (-0.56, 0.03)], 'fx': 0.18,
        'torso': [(0.96, 1.08, 0.05, 0.07), (0.90, 1.08, 0.26, 0.30), (0.62, 1.10, 0.34, 0.38), (0.20, 1.10, 0.36, 0.42), (-0.24, 1.10, 0.36, 0.43), (-0.58, 1.12, 0.33, 0.40), (-0.78, 1.10, 0.24, 0.30)],
        'piv': {'body': (0, 0.06, 1.08), 'hips': (0, 0.28, 1.08), 'chest': (0, -0.14, 1.09)},
        'neck': [(-0.76, 1.14), (-1.02, 1.22)], 'head': [(-1.02, 1.22), (-1.42, 1.02)], 'tail': [(0.96, 1.10), (1.02, 0.42)],
        'col': {'body': '#8a5a3a', 'belly': '#c9b89a', 'leg': '#7a5034', 'hoof': '#2a211c', 'snout': '#c9a090', 'tusk': '#d9c8a4', 'mane': '#3a2a22', 'eye': '#120e0c', 'ear': '#7a5034'},
        'leg_r': (0.11, 0.075, 0.05, 0.045),
    },
}
S = SPECS[NAME]

# ---------------- scene, materials, mesh helpers ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
body_c = bpy.data.collections.new('Body'); gear_c = bpy.data.collections.new('Gear')
sc.collection.children.link(body_c); sc.collection.children.link(gear_c)
M = {k: toon.material(NAME + '_' + k, v, None, 'cel') for k, v in S['col'].items()}
# ---- the boar style test (2026-10-21; Robin: the kraken's style reads far better than the beasts): BOAR_STYLE A as now; B the
# kraken's chosen three tones; C + the light taken from one smooth body and the inner line only at colour changes and overlaps;
# D + bigger, simpler pieces (the head one shape from neck to nose, each leg one limb, the bristles one ridge, the nose disc and
# the hooves painted as colour on the ends)
DEFAULT_T = 'E' if NAME == 'boar' else 'A'          # Robin picked E for the boar (2026-10-21); every other species stays as it was until its own pass
STYLE_T = os.environ.get('BOAR_STYLE', DEFAULT_T)
OUT = os.path.abspath(os.path.join(SRC, NAME + ('' if STYLE_T == DEFAULT_T else '_' + STYLE_T) + '.blend'))
def cel3(name, base, lit, shade, hi=None, t_dark=0.66, t_lit=1.2):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; n, L = nt.nodes, nt.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial'); em = n.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    v = toon._light(n, L); dark = toon._math(n, L, 'LESS_THAN', v, t_dark); bright = toon._math(n, L, 'GREATER_THAN', v, t_lit)
    col = toon._mix(n, L, 'MIX', bright, toon._mix(n, L, 'MIX', dark, toon.srgb(base), toon.srgb(shade)), toon.srgb(lit))
    if hi: col = toon._mix(n, L, 'MIX', toon._math(n, L, 'MULTIPLY', toon._math(n, L, 'GREATER_THAN', v, t_lit + 0.55), 0.55), col, toon.srgb(hi))
    col = toon._grain(n, L, col, toon.GRAIN_K, 320); L.new(col, em.inputs['Color']); L.new(em.outputs[0], out.inputs['Surface'])
    m.diffuse_color = (*toon.srgb(base), 1); return m
PALETTE3 = {'boar': {                              # base, lit, shade: a richer, darker wild-boar brown, about 35 per cent saturated, the shade cooler and a touch plum
    'body': ('#6b4a33', '#8a6142', '#3d2c33'), 'belly': ('#4f3628', '#664632', '#2c2028'), 'leg': ('#4f3628', '#664632', '#2c2028'),
    'hoof': ('#2a211c', '#3a2e27', '#191418'), 'snout': ('#9c7466', '#b68b7a', '#6a4c4a'), 'tusk': ('#e8dcc0', '#f6eedb', '#b8a88c'),
    'mane': ('#2e2420', '#45352c', '#1e171b'), 'eye': ('#120e0c', '#120e0c', '#120e0c'), 'ear': ('#5a4030', '#74533c', '#352630')}}
if STYLE_T in ('B', 'C', 'D', 'E') and NAME in PALETTE3:
    M = {k: cel3(NAME + '3_' + k, *PALETTE3[NAME][k]) for k in S['col']}

PARTS = []
def mesh_object(name, bm, mats, weights=None, group=None, smooth=True):
    """weights: a function of a vertex position giving {group: weight}; or group: one bone for the whole part"""
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); body_c.objects.link(o)
    for m in (mats if isinstance(mats, (list, tuple)) else [mats]): me.materials.append(m)
    if group: o.vertex_groups.new(name=group).add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    else:
        for v in me.vertices:
            for g, wt in weights(v.co).items():
                if wt > 0.001: (o.vertex_groups.get(g) or o.vertex_groups.new(name=g)).add([v.index], wt, 'REPLACE')
    for p in me.polygons: p.use_smooth = smooth
    PARTS.append(o); return o
def cone(name, mat, group, p0, p1, r0, r1, seg=10, sx=1.0, sy=1.0, smooth=True):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg; v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return mesh_object(name, bm, mat, group=group, smooth=smooth)
def ball(name, mat, group, c, r, sx=1.0, sy=1.0, sz=1.0, seg=10, rings=7):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    return mesh_object(name, bm, mat, group=group)
def loft(name, mats, rings, weights=None, group=None, seg=12, belly=None, squash=None):
    """rings: (y, zc, rx, rz) ellipses standing across the spine; belly: the share of a ring's height (from the bottom) that takes
    the second material; squash(a) may reshape a ring's radius by the angle round it (a flat underside, a ridge)"""
    bm = bmesh.new(); R = []
    for (y, zc, rx, rz) in rings:
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg; k = squash(a) if squash else 1.0
            ring.append(bm.verts.new((math.cos(a) * rx * k, y, zc + math.sin(a) * rz * k)))
        R.append(ring)
    faces = []
    for ri, (a, b) in enumerate(zip(R, R[1:])):
        for i in range(seg): faces.append((bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i])), ri, i))
    bm.faces.new(R[0][::-1]); bm.faces.new(R[-1])
    if belly is not None and isinstance(mats, (list, tuple)):
        for f, ri, i in faces:
            a = 2 * math.pi * (i + 1.0) / seg
            if math.sin(a) < -1 + 2 * belly: f.material_index = 1
    return mesh_object(name, bm, mats, weights=weights, group=group)

# ---------------- the rig ----------------
hind, front, PIV = S['hind'], S['front'], S['piv']
arm_data = bpy.data.armatures.new(NAME + 'Rig'); rig = bpy.data.objects.new(NAME + 'Rig', arm_data); sc.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); EB = arm_data.edit_bones
def bone(name, head, tail, parent=None):
    b = EB.new(name); b.head = Vector(head); b.tail = Vector(tail)
    if parent: b.parent = EB[parent]
    return b
V3 = lambda yz, x=0.0: Vector((x, yz[0], yz[1]))
bone('root', (0, 0, 0), (0, 0.2, 0))
bone('body', PIV['body'], Vector(PIV['body']) + Vector((0, 0, 0.15)), 'root')
bone('hips', PIV['hips'], Vector(PIV['hips']) + Vector((0, 0.25, 0)), 'body')
bone('chest', PIV['chest'], Vector(PIV['chest']) + Vector((0, -0.25, 0)), 'body')
bone('neck', V3(S['neck'][0]), V3(S['neck'][1]), 'chest'); bone('head', V3(S['head'][0]), V3(S['head'][1]), 'neck')
bone('tail', V3(S['tail'][0]), V3(S['tail'][1]), 'hips')
LEGS = {}
for side, sx in (('L', 1), ('R', -1)):
    for kind, J, x, par in (('h', hind, S['hx'], 'hips'), ('f', front, S['fx'], 'chest')):
        n = kind + side; pts = [V3(p, sx * x) for p in J]
        bone(n + '_up', pts[0], pts[1], par); bone(n + '_lo', pts[1], pts[2], n + '_up'); bone(n + '_ft', pts[2], pts[3], n + '_lo')
        LEGS[n] = {'kind': kind, 'x': sx * x, 'J': J, 'parent': par}
bpy.ops.object.mode_set(mode='OBJECT')
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'

# a direction in the side view by its angle from straight down, positive toward the front (-Y)
def ang_of(p, q): return math.atan2(-(q[0] - p[0]), -(q[1] - p[1]))
for n, L in LEGS.items():
    J = L['J']; L['len'] = [math.hypot(J[i + 1][0] - J[i][0], J[i + 1][1] - J[i][1]) for i in range(3)]
    L['rest'] = [ang_of(J[i], J[i + 1]) for i in range(3)]

# ---------------- the body ----------------
C = M; torso = S['torso']; hy, cy = PIV['hips'][1], PIV['chest'][1]
def spine_w(co):                                   # a ring behind the hips' pivot rides the hips, one before the chest's the chest, a blend between
    t = min(1.0, max(0.0, (co.y - cy) / (hy - cy))); t = t * t * (3 - 2 * t); return {'hips': t, 'chest': 1 - t}
loft('torso', [C['body'], C['belly']], torso, weights=spine_w, belly=0.30 if NAME != 'boar' else 0.22)
r_up, r_lo, r_ft, r_hoof = S['leg_r']
for n, L in LEGS.items():
    J = [V3(p, L['x']) for p in L['J']]; hindleg = L['kind'] == 'h'
    cone(n + '_upper', C['body'] if hindleg or NAME == 'boar' else C['body'], n + '_up', J[0] + Vector((0, 0, 0.04)), J[1], r_up * (1.25 if hindleg else 1.0), r_lo * 1.1, sy=1.35 if hindleg else 1.15)
    ball(n + '_knee', C['leg'], n + '_lo', J[1], r_lo * 1.08)
    cone(n + '_lower', C['leg'], n + '_lo', J[1], J[2], r_lo, r_ft * 1.1)
    ball(n + '_ankle', C['leg'], n + '_ft', J[2], r_ft * 1.15)
    cone(n + '_cannon', C['leg'], n + '_ft', J[2], J[3] + Vector((0, 0, 0.03)), r_ft, r_hoof)
    if NAME in ('wolf', 'bear'): ball(n + '_paw', C['leg'], n + '_ft', J[3] + Vector((0, -0.025, 0.015)), 0.042 if NAME == 'wolf' else 0.105, sx=0.95, sy=1.35, sz=0.6)
    else: cone(n + '_hoof', C['hoof'], n + '_ft', J[3] + Vector((0, 0, 0.045)), J[3] + Vector((0, -0.012, -0.022)), r_hoof * 1.05, r_hoof * 1.5, seg=8)
n0, n1 = V3(S['neck'][0]), V3(S['neck'][1]); h0, h1 = V3(S['head'][0]), V3(S['head'][1]); hd = (h1 - h0).normalized(); up = Vector((0, -hd.z, hd.y)) * -1
def headp(along, upw=0.0, side=0.0): return h0 + hd * along + up * upw + Vector((side, 0, 0))   # a point on the head: along the muzzle, above it, to the side
HL = (h1 - h0).length
if NAME == 'boar':
    cone('neck', C['body'], 'neck', n0 + Vector((0, 0.10, 0.02)), n1 + Vector((0, -0.02, 0)), 0.24, 0.185, sy=1.15)
    cone('skull', C['body'], 'head', headp(-0.06), headp(HL * 0.55), 0.185, 0.115, sy=1.1)
    cone('snout', C['body'], 'head', headp(HL * 0.50), headp(HL * 0.97), 0.115, 0.07)
    cone('disc', C['snout'], 'head', headp(HL * 0.95), headp(HL * 1.02), 0.074, 0.066)
    for sx in (1, -1):
        cone('ear' + str(sx), C['ear'], 'head', headp(0.03, 0.13, sx * 0.10), headp(-0.02, 0.27, sx * 0.14), 0.055, 0.012, seg=6, sx=1.0, sy=0.45)
        ball('eye' + str(sx), C['eye'], 'head', headp(HL * 0.30, 0.075, sx * 0.105), 0.019)
        cone('tusk' + str(sx), C['tusk'], 'head', headp(HL * 0.82, -0.035, sx * 0.075), headp(HL * 0.72, 0.10, sx * 0.125), 0.028, 0.006, seg=6)
    # the bristles: a ridge of spikes from the brow down the back
    for i in range(9):
        y = -0.52 + i * 0.12; zc = 0.90 if y < -0.44 else None
        ring = min(torso, key=lambda r: abs(r[0] - y)); top = ring[1] + ring[3] - 0.02
        cone('mane%d' % i, C['mane'], 'chest' if y < (hy + cy) / 2 else 'hips', (0, y, top), (0, y + 0.07, top + 0.085 - 0.004 * i), 0.045, 0.004, seg=5, sx=0.45)
    cone('tail', C['leg'], 'tail', V3(S['tail'][0]), V3(S['tail'][1]), 0.022, 0.012, seg=6)
    ball('tuft', C['mane'], 'tail', V3(S['tail'][1]) + Vector((0, 0.01, -0.03)), 0.03, sz=1.6)
elif NAME == 'deer':
    cone('neck', C['body'], 'neck', n0 + Vector((0, 0.10, -0.08)), n1 + Vector((0, 0.01, -0.02)), 0.16, 0.085, sy=1.25)
    cone('throat', C['belly'], 'neck', n0 + Vector((0, 0.0, -0.13)), n1 + Vector((0, -0.045, -0.07)), 0.09, 0.05, seg=8)
    cone('skull', C['body'], 'head', headp(-0.07), headp(HL * 0.50), 0.092, 0.07, sy=1.1)
    cone('muzzle', C['body'], 'head', headp(HL * 0.46), headp(HL * 0.96), 0.07, 0.042)
    ball('nose', C['snout'], 'head', headp(HL * 0.98, -0.004), 0.034, sz=0.85)
    for sx in (1, -1):
        cone('ear' + str(sx), C['ear'], 'head', headp(-0.03, 0.06, sx * 0.07), headp(-0.10, 0.17, sx * 0.21), 0.05, 0.012, seg=6, sx=1.0, sy=0.4)
        ball('eye' + str(sx), C['eye'], 'head', headp(HL * 0.30, 0.045, sx * 0.068), 0.02)
        # a stag's antlers: a beam sweeping up and back, three tines
        a0 = headp(-0.01, 0.085, sx * 0.045); a1 = a0 + Vector((sx * 0.09, 0.07, 0.20)); a2 = a1 + Vector((sx * 0.07, 0.10, 0.20)); a3 = a2 + Vector((sx * 0.02, -0.02, 0.16))
        cone('beamA' + str(sx), C['tusk'], 'head', a0, a1, 0.021, 0.017, seg=6); cone('beamB' + str(sx), C['tusk'], 'head', a1, a2, 0.017, 0.013, seg=6); cone('beamC' + str(sx), C['tusk'], 'head', a2, a3, 0.013, 0.004, seg=6)
        cone('brow' + str(sx), C['tusk'], 'head', a0 + Vector((sx * 0.02, 0.01, 0.04)), a0 + Vector((sx * 0.05, -0.13, 0.10)), 0.014, 0.004, seg=6)
        cone('tine1' + str(sx), C['tusk'], 'head', a1, a1 + Vector((sx * 0.05, -0.12, 0.10)), 0.013, 0.004, seg=6)
        cone('tine2' + str(sx), C['tusk'], 'head', a2, a2 + Vector((sx * 0.08, -0.07, 0.11)), 0.011, 0.004, seg=6)
    cone('tail', C['mane'], 'tail', V3(S['tail'][0]), V3(S['tail'][1]), 0.045, 0.02, seg=8, sy=0.7)
    ball('rump', C['mane'], 'hips', (0, 0.70, 0.96), 0.115, sy=0.45, sz=1.1)
elif NAME == 'bear':
    cone('neck', C['body'], 'neck', n0 + Vector((0, 0.14, 0.0)), n1 + Vector((0, -0.02, 0)), 0.33, 0.25, sy=1.1)
    cone('skull', C['body'], 'head', headp(-0.10), headp(HL * 0.52), 0.25, 0.165, sy=0.95)
    cone('muzzle', C['snout'], 'head', headp(HL * 0.46, -0.03), headp(HL * 0.96, -0.045), 0.125, 0.085)
    ball('nose', C['hoof'], 'head', headp(HL * 0.99, -0.03), 0.05, sz=0.8)
    for sx in (1, -1):
        ball('ear' + str(sx), C['ear'], 'head', headp(-0.02, 0.21, sx * 0.17), 0.075, sy=0.5)
        ball('eye' + str(sx), C['eye'], 'head', headp(HL * 0.36, 0.085, sx * 0.105), 0.022)
    ball('tail', C['body'], 'tail', V3(S['tail'][1]), 0.07)
    for n, L in LEGS.items():                          # claws on every paw
        for cx in (-0.05, 0.0, 0.05): cone(n + '_claw%d' % int(cx * 100), C['tusk'], n + '_ft', V3(L['J'][3], L['x'] + cx) + Vector((0, -0.11, 0.03)), V3(L['J'][3], L['x'] + cx) + Vector((0, -0.19, 0.0)), 0.016, 0.003, seg=5)
elif NAME == 'moose':
    cone('neck', C['body'], 'neck', n0 + Vector((0, 0.14, -0.10)), n1 + Vector((0, 0.0, -0.03)), 0.27, 0.16, sy=1.3)
    cone('skull', C['body'], 'head', headp(-0.10), headp(HL * 0.45), 0.16, 0.125, sy=1.15)
    cone('muzzle', C['snout'], 'head', headp(HL * 0.42, -0.01), headp(HL * 0.86, -0.045), 0.125, 0.115, sy=1.1)
    ball('nose', C['snout'], 'head', headp(HL * 0.93, -0.075), 0.125, sy=1.0, sz=1.05)                       # the heavy drooping nose
    cone('bell', C['mane'], 'head', headp(HL * 0.30, -0.13), headp(HL * 0.24, -0.34), 0.055, 0.02, seg=7)       # the bell under the chin
    for i in range(5):                                 # the mane over the hump
        y = -0.80 + i * 0.13; ring = min(torso, key=lambda r: abs(r[0] - y)); cone('mane%d' % i, C['mane'], 'chest', (0, y, ring[1] + ring[3] - 0.03), (0, y + 0.08, ring[1] + ring[3] + 0.09), 0.06, 0.006, seg=5, sx=0.5)
    for sx in (1, -1):
        cone('ear' + str(sx), C['ear'], 'head', headp(-0.05, 0.10, sx * 0.11), headp(-0.14, 0.22, sx * 0.30), 0.07, 0.015, seg=6, sx=1.0, sy=0.4)
        ball('eye' + str(sx), C['eye'], 'head', headp(HL * 0.22, 0.075, sx * 0.118), 0.026)
        # a palm of an antler: a short beam out to the side, a broad flat blade, tines along its front and outer edge
        a0 = headp(-0.02, 0.13, sx * 0.08); a1 = a0 + Vector((sx * 0.20, 0.03, 0.03)); pc = a1 + Vector((sx * 0.27, 0.06, 0.07))
        cone('beam' + str(sx), C['tusk'], 'head', a0, a1, 0.04, 0.035, seg=6)
        ball('palm' + str(sx), C['tusk'], 'head', pc, 0.30, sx=1.0, sy=0.8, sz=0.10)
        for (dx, dy, dz) in ((0.10, -0.24, 0.06), (0.24, -0.22, 0.10), (0.36, -0.12, 0.13), (0.40, 0.04, 0.15), (0.34, 0.20, 0.14), (-0.06, -0.26, 0.02)):
            b = pc + Vector((sx * dx * 0.75, dy * 0.75, dz * 0.4)); cone('tine%d%d' % (sx, int(dx * 100)), C['tusk'], 'head', b, pc + Vector((sx * dx * 1.35, dy * 1.4, dz + 0.08)), 0.05, 0.014, seg=5)
    cone('tail', C['body'], 'tail', V3(S['tail'][0]), V3(S['tail'][1]), 0.05, 0.02, seg=6)
elif NAME == 'goat':
    cone('neck', C['body'], 'neck', n0 + Vector((0, 0.08, -0.05)), n1 + Vector((0, 0.0, -0.01)), 0.12, 0.075, sy=1.2)
    cone('skull', C['body'], 'head', headp(-0.05), headp(HL * 0.50), 0.08, 0.06, sy=1.05)
    cone('muzzle', C['body'], 'head', headp(HL * 0.46), headp(HL * 0.96), 0.06, 0.04)
    ball('nose', C['snout'], 'head', headp(HL * 0.98, -0.004), 0.028, sz=0.85)
    cone('beard', C['mane'], 'head', headp(HL * 0.70, -0.045), headp(HL * 0.62, -0.16), 0.035, 0.008, seg=6)
    for sx in (1, -1):
        cone('ear' + str(sx), C['ear'], 'head', headp(-0.02, 0.03, sx * 0.06), headp(-0.06, 0.02, sx * 0.19), 0.04, 0.012, seg=6, sx=1.0, sy=0.4)        # ears out sideways
        ball('eye' + str(sx), C['eye'], 'head', headp(HL * 0.30, 0.04, sx * 0.06), 0.018, sy=0.6)
        h0_ = headp(-0.02, 0.07, sx * 0.035); h1_ = h0_ + Vector((sx * 0.03, 0.10, 0.12)); h2_ = h1_ + Vector((sx * 0.02, 0.09, 0.05))                   # the horns, swept back
        cone('hornA' + str(sx), C['tusk'], 'head', h0_, h1_, 0.022, 0.015, seg=6); cone('hornB' + str(sx), C['tusk'], 'head', h1_, h2_, 0.015, 0.004, seg=6)
    cone('tail', C['body'], 'tail', V3(S['tail'][0]), V3(S['tail'][1]), 0.03, 0.012, seg=6)
elif NAME == 'sheep':
    cone('neck', C['mane'], 'neck', n0 + Vector((0, 0.10, -0.04)), n1 + Vector((0, 0.0, -0.01)), 0.17, 0.09, sy=1.2)                                     # the wool runs up the neck
    cone('skull', C['snout'], 'head', headp(-0.04), headp(HL * 0.52), 0.07, 0.055, sy=1.05)
    cone('muzzle', C['snout'], 'head', headp(HL * 0.48), headp(HL * 0.98), 0.052, 0.035)
    ball('poll', C['mane'], 'head', headp(0.0, 0.05), 0.06, sy=1.1, sz=0.8)                                                                                 # a cap of wool on the poll
    for sx in (1, -1):
        cone('ear' + str(sx), C['ear'], 'head', headp(0.0, 0.02, sx * 0.05), headp(-0.03, 0.0, sx * 0.16), 0.035, 0.01, seg=6, sx=1.0, sy=0.45)
        ball('eye' + str(sx), C['tusk'], 'head', headp(HL * 0.32, 0.035, sx * 0.055), 0.015)
    cone('tail', C['mane'], 'tail', V3(S['tail'][0]), V3(S['tail'][1]), 0.045, 0.02, seg=6)
elif NAME == 'cow':
    cone('neck', C['body'], 'neck', n0 + Vector((0, 0.12, -0.08)), n1 + Vector((0, 0.0, -0.02)), 0.24, 0.14, sy=1.25)
    cone('dewlap', C['belly'], 'neck', n0 + Vector((0, 0.0, -0.22)), n1 + Vector((0, -0.04, -0.12)), 0.09, 0.05, seg=8)
    cone('skull', C['body'], 'head', headp(-0.08), headp(HL * 0.46), 0.14, 0.11, sy=1.1)
    cone('muzzle', C['body'], 'head', headp(HL * 0.42), headp(HL * 0.94), 0.11, 0.085)
    ball('nose', C['snout'], 'head', headp(HL * 0.98, -0.01), 0.075, sy=1.1, sz=0.8)
    for sx in (1, -1):
        cone('ear' + str(sx), C['ear'], 'head', headp(-0.02, 0.06, sx * 0.10), headp(-0.06, 0.05, sx * 0.30), 0.06, 0.015, seg=6, sx=1.0, sy=0.4)
        ball('eye' + str(sx), C['eye'], 'head', headp(HL * 0.28, 0.06, sx * 0.10), 0.024)
        h0_ = headp(-0.04, 0.12, sx * 0.07); h1_ = h0_ + Vector((sx * 0.14, 0.02, 0.06)); h2_ = h1_ + Vector((sx * 0.06, -0.02, 0.10))                  # short horns out and up
        cone('hornA' + str(sx), C['tusk'], 'head', h0_, h1_, 0.035, 0.025, seg=6); cone('hornB' + str(sx), C['tusk'], 'head', h1_, h2_, 0.025, 0.006, seg=6)
    ball('udder', C['snout'], 'hips', (0, 0.42, 0.72), 0.16, sx=1.0, sy=1.2, sz=0.8)
    cone('tail', C['body'], 'tail', V3(S['tail'][0]), V3(S['tail'][1]), 0.035, 0.018, seg=6); ball('tuft', C['mane'], 'tail', V3(S['tail'][1]) + Vector((0, 0.01, -0.06)), 0.05, sz=1.5)
else:   # wolf
    cone('neck', C['body'], 'neck', n0 + Vector((0, 0.10, -0.04)), n1 + Vector((0, 0.0, -0.01)), 0.15, 0.105, sy=1.2)
    cone('ruff', C['belly'], 'neck', n0 + Vector((0, 0.02, -0.10)), n1 + Vector((0, -0.03, -0.07)), 0.10, 0.07, seg=8)
    cone('skull', C['body'], 'head', headp(-0.08), headp(HL * 0.50), 0.108, 0.078, sy=0.95)
    cone('muzzle', C['belly'], 'head', headp(HL * 0.45, -0.012), headp(HL * 0.97, -0.02), 0.062, 0.04)
    ball('nose', C['snout'], 'head', headp(HL * 0.99, -0.012), 0.03)
    for sx in (1, -1):
        cone('ear' + str(sx), C['ear'], 'head', headp(-0.02, 0.07, sx * 0.065), headp(-0.03, 0.19, sx * 0.085), 0.045, 0.006, seg=6, sx=1.0, sy=0.45)
        ball('eye' + str(sx), C['eye'], 'head', headp(HL * 0.30, 0.04, sx * 0.064), 0.017)
    t0, t1 = V3(S['tail'][0]), V3(S['tail'][1]); tm = t0.lerp(t1, 0.55)
    cone('tailA', C['body'], 'tail', t0, tm, 0.04, 0.07, seg=8); cone('tailB', C['mane'], 'tail', tm, t1, 0.07, 0.015, seg=8)
from mathutils.bvhtree import BVHTree
def drop(names):
    for o in [o for o in PARTS if o.name in names or any(o.name.startswith(nm) for nm in names if nm.endswith('*'))]:
        PARTS.remove(o); bpy.data.objects.remove(o)
def lerp_rings(pts, radii, k):                      # k extra rings between every pair, linear
    P, Rr = [], []
    for i in range(len(pts) - 1):
        for j in range(k + 1):
            t = j / (k + 1); P.append(pts[i].lerp(pts[i + 1], t)); Rr.append((radii[i][0] + (radii[i + 1][0] - radii[i][0]) * t, radii[i][1] + (radii[i + 1][1] - radii[i][1]) * t))
    P.append(pts[-1]); Rr.append(radii[-1]); return P, Rr
def along(pts, co):                                  # the distance along a polyline of its nearest point to co, and that point
    best = (1e9, 0.0, pts[0]); acc = 0.0
    for a, b in zip(pts, pts[1:]):
        ab = b - a; L = ab.length; t = max(0.0, min(1.0, (co - a).dot(ab) / (L * L))) if L > 1e-9 else 0.0; c = a + ab * t; d = (co - c).length
        if d < best[0]: best = (d, acc + t * L, c)
        acc += L
    return best[1], best[2]
def tube(name, pts, radii, mats, seg_mat, weights, seg=14, cap0=None, cap1=None):
    bm = bmesh.new(); rows = []; n = len(pts)
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized(); side = Vector((1, 0, 0)); side = (side - t * side.dot(t)).normalized(); upv = t.cross(side).normalized()
        rx, rz = radii[i]; rows.append([bm.verts.new(p + side * math.cos(2 * math.pi * (j + 0.5) / seg) * rx + upv * math.sin(2 * math.pi * (j + 0.5) / seg) * rz) for j in range(seg)])
    for i, (a, b) in enumerate(zip(rows, rows[1:])):
        for j in range(seg): f = bm.faces.new((a[j], a[(j + 1) % seg], b[(j + 1) % seg], b[j])); f.material_index = seg_mat(i)
    f0 = bm.faces.new(rows[0][::-1]); f1 = bm.faces.new(rows[-1]); f0.material_index = seg_mat(0) if cap0 is None else cap0; f1.material_index = seg_mat(n - 2) if cap1 is None else cap1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm, mats, weights=weights)
def sstep(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
LEGPATH = {}
for nl, Lg in LEGS.items():
    J = [V3(q, Lg['x']) for q in Lg['J']]; LEGPATH[nl] = [J[0] + Vector((0, 0, 0.04)), J[1], J[2], J[3] + Vector((0, 0, 0.045)), J[3] + Vector((0, -0.012, -0.022))]
if STYLE_T in ('D', 'E') and NAME == 'boar':
    drop(['neck', 'skull', 'snout', 'disc'] + ['mane%d' % i for i in range(9)] + [nl + suf for nl in LEGS for suf in ('_upper', '_knee', '_lower', '_ankle', '_cannon', '_hoof')])
    # the head: one shape from inside the chest to the nose, the disc painted on its end
    HP = [n0 + Vector((0, 0.10, 0.02)), n0.lerp(n1, 0.5) + Vector((0, 0.04, 0.01)), headp(-0.06), headp(HL * 0.30), headp(HL * 0.55), headp(HL * 0.80), headp(HL * 0.97), headp(HL * 1.02)]
    HR = [(0.24, 0.27), (0.215, 0.24), (0.19, 0.205), (0.16, 0.17), (0.125, 0.13), (0.095, 0.097), (0.074, 0.073), (0.068, 0.066)]
    HPp, HRr = lerp_rings(HP, HR, 2); s_h0, _ = along(HPp, h0)
    def head_w(co):
        sv, _ = along(HPp, co); w = sstep(s_h0 - 0.07, s_h0 + 0.05, sv); return {'neck': 1 - w, 'head': w}
    ndisc = len(HPp) - 2
    tube('head_one', HPp, HRr, [C['body'], C['snout']], lambda i: 1 if i >= ndisc else 0, head_w, seg=16, cap0=0, cap1=1)
    # the eyes, set on the new head's surface (the old ones sat 1.5 cm inside it), a little larger, a lighter ring round each so the
    # dark eye shows on the dark head, and a catchlight (Robin, 2026-10-21: "I don't really see its eyes")
    drop(['eye1', 'eye-1'])
    hobj = next(o for o in PARTS if o.name == 'head_one'); hb = bmesh.new(); hb.from_mesh(hobj.data); hb.normal_update(); HT = BVHTree.FromBMesh(hb)
    C_ring = cel3(NAME + '3_eyering', '#8a6142', '#a37552', '#5a4030'); C_glint = cel3(NAME + '3_glint', '#f4efe4', '#f4efe4', '#d8d2c4')
    def flat_ball(name, mat, c, r, nrm, flat):
        bmf = bmesh.new(); bmesh.ops.create_uvsphere(bmf, u_segments=14, v_segments=9, radius=1.0)
        bmesh.ops.transform(bmf, matrix=Matrix.Translation(c) @ nrm.to_track_quat('Z', 'Y').to_matrix().to_4x4() @ Matrix.Diagonal((r, r, r * flat, 1.0)), verts=bmf.verts)
        return mesh_object(name, bmf, mat, group='head')
    for sx in (1, -1):
        ax = headp(HL * 0.30); dvec = (Vector((sx, 0, 0)) * 0.105 + up * 0.075).normalized(); hit = HT.ray_cast(ax + dvec * 0.5, -dvec)
        if hit[0] is None: continue
        sp, sn = hit[0], hit[1].normalized()
        # (Robin, 2026-10-21: the round eye with a light ring "pops a bit much, he looks a little surprised") a boar's eye is small and
        # deep-set under a heavy brow: a small almond eye, no ring, a fold of brow over its top tilted down toward the snout, a small catchlight
        u = (up - sn * up.dot(sn)).normalized(); w = sn.cross(u).normalized()
        if w.dot(hd) < 0: w = -w
        def ellip(name, mat, c, rw, ru, rn, tilt=0.0):
            a = math.radians(tilt); w2 = w * math.cos(a) - u * math.sin(a); u2 = u * math.cos(a) + w * math.sin(a)
            bme = bmesh.new(); bmesh.ops.create_uvsphere(bme, u_segments=14, v_segments=9, radius=1.0)
            B = Matrix((w2 * rw, u2 * ru, sn * rn)).transposed().to_4x4(); B.translation = c
            bmesh.ops.transform(bme, matrix=B, verts=bme.verts); return mesh_object(name, bme, mat, group='head')
        ellip('eye' + str(sx), C['eye'], sp + sn * 0.005, 0.027, 0.012, 0.011, tilt=15)     # a dark almond, its front end lower: wary, not surprised
        ellip('brow' + str(sx), C['mane'], sp + sn * 0.003 + u * 0.021 + w * 0.002, 0.036, 0.0055, 0.004, tilt=22)   # a short dark brow stroke lying on the skin, slanting down to the snout
        ball('glint' + str(sx), C_glint, 'head', sp + sn * 0.016 + u * 0.002 - w * 0.009, 0.005)
    # each leg one limb: the upper part in the body's colour, below the knee the leg's, the hoof painted on the end
    for nl, Lg in LEGS.items():
        LP = LEGPATH[nl]; hindleg = Lg['kind'] == 'h'; ku = 1.25 if hindleg else 1.0; sy = 1.35 if hindleg else 1.15
        LR = [(r_up * ku, r_up * ku * sy), (r_lo * 1.1, r_lo * 1.2), (r_ft * 1.15, r_ft * 1.15), (r_hoof * 1.05, r_hoof * 1.05), (r_hoof * 1.5, r_hoof * 1.4)]
        LPp, LRr = lerp_rings(LP, LR, 3); seg_len = [(b - a).length for a, b in zip(LP, LP[1:])]; s1 = seg_len[0]; s2 = s1 + seg_len[1]; s3 = s2 + seg_len[2]
        cum = [0.0]
        for a, b in zip(LPp, LPp[1:]): cum.append(cum[-1] + (b - a).length)
        def leg_mat(i, cum=cum, s1=s1, s3=s3): m = 0.5 * (cum[i] + cum[i + 1]); return 2 if m > s3 else (1 if m > s1 * 0.85 else 0)
        def leg_w(co, LPp=LPp, s1=s1, s2=s2, nl=nl):
            sv, _ = along(LPp, co); a = sstep(s1 - 0.03, s1 + 0.03, sv); b = sstep(s2 - 0.025, s2 + 0.025, sv); return {nl + '_up': 1 - a, nl + '_lo': a - b, nl + '_ft': b}
        tube(nl + '_limb', LPp, LRr, [C['body'], C['leg'], C['hoof']], leg_mat, leg_w, seg=12, cap0=0, cap1=2)
    # the bristles: one jagged ridge along the back, leaning back as the spikes did
    TR = sorted(torso, key=lambda r: r[0])
    def back_z(y):
        if y <= TR[0][0]: return TR[0][1] + TR[0][3]
        for a, b in zip(TR, TR[1:]):
            if a[0] <= y <= b[0]: t = (y - a[0]) / (b[0] - a[0]); return (a[1] + a[3]) + ((b[1] + b[3]) - (a[1] + a[3])) * t
        return TR[-1][1] + TR[-1][3]
    y0, y1, step, bm = -0.56, 0.50, 0.01, bmesh.new(); rows = []
    ys = [y0 + i * step for i in range(int((y1 - y0) / step) + 1)]
    for y in ys:
        k = int((y - y0) / 0.12); u = ((y - y0) % 0.12) / 0.12; hk = (0.085 - 0.004 * k) * (0.85 + 0.3 * abs(math.sin(k * 2.1)))
        hgt = 0.012 + (hk * (u / 0.72) if u < 0.72 else hk * max(0.0, (1 - u) / 0.28)); top = back_z(y) - 0.02; zt = top + hgt; zb = top - 0.04
        wt = 0.005 + 0.016 * (1 - hgt / max(hk, 0.02)); wb = 0.03
        rows.append((bm.verts.new((wb, y, zb)), bm.verts.new((-wb, y, zb)), bm.verts.new((wt, y, zt)), bm.verts.new((-wt, y, zt))))
    for (b0, c0, t0, d0), (b1, c1, t1, d1) in zip(rows, rows[1:]):
        bm.faces.new((b0, b1, t1, t0)); bm.faces.new((c1, c0, d0, d1)); bm.faces.new((t0, t1, d1, d0)); bm.faces.new((c0, c1, b1, b0))
    for (b0, c0, t0, d0), flip in ((rows[0], False), (rows[-1], True)):
        f = (b0, t0, d0, c0); bm.faces.new(f[::-1] if flip else f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); mesh_object('bristle_ridge', bm, C['mane'], weights=spine_w)
if STYLE_T == 'E' and NAME == 'boar':
    # E: D with hair (Robin, 2026-10-21: "maybe he needs more hair to look more natural"): every tuft a jagged strip on the outline,
    # never strands; a tall ragged crest down the back, highest over the shoulders, and a short one on the crown and neck; a
    # fringe under the jaw and the throat; tufts on the cheeks; a shaggy fringe along the belly; a ragged skirt at the top of
    # each leg. Each in the boar's own colours, bound to the bones it sits on, lit from the one smooth body.
    import random as _rnd
    RH = _rnd.Random(7)
    drop(['bristle_ridge'])
    def ragged(name, bases, ups, heights, mat, weights, wb=0.03, wt0=0.006, sink=0.035, lean=None):
        bm = bmesh.new(); rows = []; n = len(bases); hmax = max(heights) or 1.0
        for i in range(n):
            b, u, h = bases[i], ups[i].normalized(), heights[i]
            t = bases[min(i + 1, n - 1)] - bases[max(i - 1, 0)]; t = t.normalized() if t.length > 1e-6 else Vector((0, 1, 0))
            sd = t.cross(u); sd = sd.normalized() if sd.length > 1e-6 else Vector((1, 0, 0)); wt = wt0 + wb * 0.55 * (1 - h / hmax)
            tip = b + u * h + (lean[i] if lean else Vector((0, 0, 0))); bot = b - u * sink
            rows.append((bm.verts.new(bot + sd * wb), bm.verts.new(bot - sd * wb), bm.verts.new(tip + sd * wt), bm.verts.new(tip - sd * wt)))
        for (b0, c0, t0, d0), (b1, c1, t1, d1) in zip(rows, rows[1:]):
            bm.faces.new((b0, b1, t1, t0)); bm.faces.new((c1, c0, d0, d1)); bm.faces.new((t0, t1, d1, d0)); bm.faces.new((c0, c1, b1, b0))
        for (b0, c0, t0, d0), flip in ((rows[0], False), (rows[-1], True)):
            f = (b0, t0, d0, c0); bm.faces.new(f[::-1] if flip else f)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces); return mesh_object(name, bm, mat, weights=weights)
    def saw(svals, period, hfun, peak=0.68, jitter=0.35):   # a tooth every period, rising slowly and dropping fast (leaning back), each its own height
        out, cache = [], {}
        for sv in svals:
            k = int(sv // period); u = (sv % period) / period
            if k not in cache: cache[k] = hfun(k * period) * (1 - jitter + 2 * jitter * RH.random())
            hk = cache[k]; out.append(0.008 + (hk * (u / peak) if u < peak else hk * max(0.0, (1 - u) / (1 - peak))))
        return out
    def dense(pts, step=0.006):                       # points every step along a polyline, and their arc lengths
        out, ss, acc = [pts[0]], [0.0], 0.0
        for a, b in zip(pts, pts[1:]):
            L = (b - a).length; n = max(1, int(L / step))
            for j in range(1, n + 1): out.append(a.lerp(b, j / n)); acc += L / n; ss.append(acc)
        return out, ss
    # the crest along the back, front to back so the teeth lean back; highest over the shoulders' hump
    ys = [-0.56 + i * 0.006 for i in range(int(1.02 / 0.006) + 1)]
    cb = [Vector((0, y, back_z(y) - 0.015)) for y in ys]; cs = [y + 0.56 for y in ys]
    hump = lambda sv: (lambda y: 0.07 + 0.11 * math.exp(-((y + 0.28) / 0.26) ** 2))(-0.56 + sv)
    ragged('hair_crest', cb, [Vector((0, 0.18, 1))] * len(cb), saw(cs, 0.06, hump), C['mane'], spine_w, wb=0.036, lean=[Vector((0, 0.02, 0))] * len(cb))
    # the head's own rings: their tops (crown and neck), bottoms (jaw and throat) and sides (cheeks)
    ringS = [along(HPp, q)[0] for q in HPp]
    def ring_pts(lo, hi, f):
        sel = [i for i, sv in enumerate(ringS) if lo <= sv <= hi]; return [f(HPp[i], HRr[i]) for i in sel]
    crown = ring_pts(s_h0 - 0.16, s_h0 + 0.14, lambda q, r: q + up * r[1] * 0.92)[::-1]   # from the crown back over the neck
    cpts, css = dense(crown); ragged('hair_crown', cpts, [up + Vector((0, 0.25, 0))] * len(cpts), saw(css, 0.05, lambda sv: 0.05 + 0.2 * sv), C['mane'], head_w, wb=0.03)
    under = ring_pts(s_h0 - 0.12, s_h0 + HL * 0.55, lambda q, r: q - up * r[1] * 0.9)[::-1]   # from the jaw back to the throat
    upts, uss = dense(under); ragged('hair_jowl', upts, [-up * 0.85 + Vector((0, 0.35, 0))] * len(upts), saw(uss, 0.045, lambda sv: 0.045 + 0.14 * sv), C['mane'], head_w, wb=0.034)
    for sx in (1, -1):
        cheek = ring_pts(s_h0 + HL * 0.12, s_h0 + HL * 0.5, lambda q, r, sx=sx: q + Vector((sx, 0, 0)) * r[0] * 0.93 - up * r[1] * 0.35)[::-1]
        kp, ks = dense(cheek); ragged('hair_cheek' + str(sx), kp, [Vector((sx * 0.7, 0.3, 0)) - up * 0.6] * len(kp), saw(ks, 0.04, lambda sv: 0.045 + 0.08 * sv), C['mane'], head_w, wb=0.026)
    # the belly's fringe, front to back
    def belly_z(y):
        TRb = sorted(torso, key=lambda r: r[0])
        if y <= TRb[0][0]: return TRb[0][1] - TRb[0][3]
        for a, b in zip(TRb, TRb[1:]):
            if a[0] <= y <= b[0]: t = (y - a[0]) / (b[0] - a[0]); return (a[1] - a[3]) + ((b[1] - b[3]) - (a[1] - a[3])) * t
        return TRb[-1][1] - TRb[-1][3]
    bys = [-0.42 + i * 0.006 for i in range(int(0.84 / 0.006) + 1)]
    bb = [Vector((0, y, belly_z(y) + 0.02)) for y in bys]
    ragged('hair_belly', bb, [Vector((0, 0.25, -1))] * len(bb), saw([y + 0.42 for y in bys], 0.05, lambda sv: 0.06), C['mane'], spine_w, wb=0.06)
    # a ragged skirt at the top of each leg (the shoulders and the hams), named for its leg so it takes the leg's light
    for nl, Lg in LEGS.items():
        LP = LEGPATH[nl]; hindleg = Lg['kind'] == 'h'; ku = 1.25 if hindleg else 1.0; sy = 1.35 if hindleg else 1.15
        P = LP[0].lerp(LP[1], 0.34); t = (LP[1] - LP[0]).normalized(); ax1 = (Vector((1, 0, 0)) - t * t.x).normalized(); ax2 = t.cross(ax1).normalized()
        r = r_up * ku * 0.98; N = 20; bm = bmesh.new(); ring_b, ring_t, ring_i = [], [], []
        for i in range(N):
            a = 2 * math.pi * i / N; rad_v = ax1 * math.cos(a) + ax2 * math.sin(a) * sy; L = 0.045 + 0.045 * RH.random() * (1 if i % 2 else 0.5)
            b = P + rad_v * r; ring_b.append(bm.verts.new(b)); ring_t.append(bm.verts.new(b + rad_v.normalized() * 0.022 + t * L)); ring_i.append(bm.verts.new(P + rad_v * r * 0.8 + t * L * 0.6))
        for i in range(N):
            j = (i + 1) % N; bm.faces.new((ring_b[i], ring_b[j], ring_t[j], ring_t[i])); bm.faces.new((ring_t[i], ring_t[j], ring_i[j], ring_i[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces); mesh_object(nl + '_skirt', bm, C['body'], group=nl + '_up')
if STYLE_T in ('C', 'D', 'E') and NAME == 'boar':
    # the light from one smooth body: the trunk's and the head's normals taken from a melted, smoothed copy of them; the legs'
    # from a smooth tube along each leg; the bristles take the back's light
    trunk = [o for o in PARTS if o.name in ('torso', 'neck', 'skull', 'snout', 'disc', 'head_one')]
    bmp = bmesh.new()
    for o in trunk: bmp.from_mesh(o.data)
    mep = bpy.data.meshes.new('proxy'); bmp.to_mesh(mep); bmp.free(); tmp = bpy.data.objects.new('proxy', mep); sc.collection.objects.link(tmp)
    rm = tmp.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.05
    smd = tmp.modifiers.new('sm', 'SMOOTH'); smd.factor = 1.0; smd.iterations = 18
    dg = bpy.context.evaluated_depsgraph_get(); me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg)); bpy.data.objects.remove(tmp)
    PROXY = bmesh.new(); PROXY.from_mesh(me2); PROXY.normal_update(); TREE = BVHTree.FromBMesh(PROXY)
    def set_normals(o, fn, k=0.85):
        me = o.data; vn = []
        for v in me.vertices:
            n = fn(v.co); vn.append(((n * k + v.normal * (1 - k)).normalized())[:] if n is not None else v.normal[:])
        me.normals_split_custom_set_from_vertices(vn)
    def proxy_n(co):
        hit = TREE.find_nearest(co); return hit[1].normalized() if hit and hit[1] is not None else None
    for o in list(PARTS):
        nm = o.name
        if o in trunk or nm.startswith('mane') or nm == 'bristle_ridge' or nm.startswith('hair_'): set_normals(o, proxy_n, 0.85 if o in trunk else 0.7)
        else:
            for nl in LEGS:
                if nm.startswith(nl + '_') and not nm.endswith('_hoof'):
                    LP = LEGPATH[nl][:4]
                    def tube_n(co, LP=LP):
                        _, c = along(LP, co); d = co - c; return d.normalized() if d.length > 1e-5 else None
                    set_normals(o, tube_n, 0.85)
for o in PARTS:
    md = o.modifiers.new('rig', 'ARMATURE'); md.object = rig; o.parent = rig
if NAME == 'wolf':                                  # the eyes' places for the night glow: render.py writes them per frame (rig['marks'])
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT'); EB = arm_data.edit_bones
    for sx, s in ((1, 'L'), (-1, 'R')): e = headp(HL * 0.30, 0.04, sx * 0.064); bone('eye.' + s, e + Vector((0, 0.03, 0)), e, 'head')
    bpy.ops.object.mode_set(mode='OBJECT'); rig['marks'] = 'eye.L,eye.R'
    for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'

# ---------------- posing ----------------
REST = {b.name: b.matrix_local.to_3x3() for b in arm_data.bones}
RX = lambda d: Matrix.Rotation(rad(d), 3, 'X'); RY = lambda d: Matrix.Rotation(rad(d), 3, 'Y'); RZ = lambda d: Matrix.Rotation(rad(d), 3, 'Z')
def set_rot(name, R3, frame):
    pb = rig.pose.bones[name]; B = REST[name]; pb.rotation_quaternion = (B.inverted() @ R3 @ B).to_quaternion(); pb.keyframe_insert('rotation_quaternion', frame=frame)
def about(piv, R3, loc=(0, 0, 0)):
    p = Vector(piv); return Matrix.Translation(Vector(loc)) @ Matrix.Translation(p) @ R3.to_4x4() @ Matrix.Translation(-p)
def solve(L, target, cannon, bend):
    """the leg in its own plane: target (y, z) of the hoof and the cannon's angle, both in the parent's rest space; returns the
    three bones' turns from rest, as direction angles (positive forward)"""
    l1, l2, l3 = L['len']; r1, r2, r3 = L['rest']; J = L['J'][0]
    ay = target[0] + math.sin(cannon) * l3; az = target[1] + math.cos(cannon) * l3          # the ankle: back up the cannon from the hoof
    dy, dz = ay - J[0], az - J[1]; d = math.hypot(dy, dz); d = max(abs(l1 - l2) + 0.004, min(l1 + l2 - 0.004, d))
    aJA = math.atan2(-dy, -dz); alpha = math.acos(max(-1, min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
    t1 = aJA + bend * alpha; ky, kz = J[0] - math.sin(t1) * l1, J[1] - math.cos(t1) * l1
    ey, ez = J[0] - math.sin(aJA) * d, J[1] - math.cos(aJA) * d                                # the ankle the clamped reach allows
    t2 = math.atan2(-(ey - ky), -(ez - kz))
    return (t1 - r1, (t2 - r2) - (t1 - r1), (cannon - r3) - (t2 - r2))
def pose(frame, P):
    """P: loc (x, y, z), pitch (front down), roll, yaw; hips, chest (pitch of each, front down); neck, head (pitch; yaw as neck_yaw,
    head_yaw); tail (pitch), wag; legs: {name: ('w', y, z, cannon_deg)} a hoof in the world, ('l', y, z, cannon_deg) in the body's
    own space, or ('fk', d1, d2, d3) turns in degrees"""
    g = P.get; loc = Vector(g('loc', (0, 0, 0))); bp = g('pitch', 0.0)
    Rb = RZ(g('yaw', 0.0)) @ RY(g('roll', 0.0)) @ RX(bp)
    pb = rig.pose.bones['body']; pb.location = REST['body'].inverted() @ loc; pb.keyframe_insert('location', frame=frame); set_rot('body', Rb, frame)
    Mb = about(PIV['body'], Rb, loc)
    Mp = {}
    for nm in ('hips', 'chest'):
        R = RZ(g(nm + '_yaw', 0.0)) @ RX(g(nm, 0.0)); set_rot(nm, R, frame); Mp[nm] = Mb @ about(PIV[nm], R)
    set_rot('neck', RZ(g('neck_yaw', 0.0)) @ RX(g('neck', 0.0)), frame); set_rot('head', RZ(g('head_yaw', 0.0)) @ RY(g('head_roll', 0.0)) @ RX(g('head', 0.0)), frame)
    set_rot('tail', RZ(g('wag', 0.0)) @ RX(g('tail', 0.0)), frame)
    for n, L in LEGS.items():
        spec = g('legs', {}).get(n) or ('w', L['J'][3][0], L['J'][3][1], math.degrees(L['rest'][2]))
        if spec[0] == 'fk': d1, d2, d3 = (rad(v) for v in spec[1:4])
        else:
            ppitch = rad(bp + g(L['parent'], 0.0)); bend = 1 if L['kind'] == 'h' else -1
            if spec[0] == 'w':
                tl = Mp[L['parent']].inverted() @ Vector((L['x'], spec[1], spec[2])); d1, d2, d3 = solve(L, (tl.y, tl.z), rad(spec[3]) + ppitch, bend)
            else: d1, d2, d3 = solve(L, (spec[1], spec[2]), rad(spec[3]), bend)
        for suffix, dd in (('_up', d1), ('_lo', d2), ('_ft', d3)): set_rot(n + suffix, RX(-math.degrees(dd)), frame)
def clip(name, length, fn):
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = length
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    for f in range(1, length + 1): pose(f, fn((f - 1) / length))
    return act

# ---------------- gaits ----------------
GAIT = {
    'boar': {'walk': dict(S=0.30, h=0.07, beta=0.62, bob=0.012, lift=38), 'run': dict(S=0.56, h=0.15, beta=0.36, bob=0.045, pitch=4, flex=7, lift=60)},
    'deer': {'walk': dict(S=0.40, h=0.10, beta=0.62, bob=0.014, lift=26), 'run': dict(S=0.92, h=0.26, beta=0.30, bob=0.11, pitch=6, flex=11, lift=75)},
    'wolf': {'walk': dict(S=0.40, h=0.07, beta=0.58, bob=0.012, lift=40), 'run': dict(S=0.80, h=0.17, beta=0.32, bob=0.055, pitch=5, flex=13, lift=70)},
    'bear': {'walk': dict(S=0.50, h=0.10, beta=0.62, bob=0.02, lift=30), 'run': dict(S=0.95, h=0.20, beta=0.36, bob=0.07, pitch=5, flex=9, lift=50)},
    'moose': {'walk': dict(S=0.75, h=0.18, beta=0.62, bob=0.02, lift=30), 'run': dict(S=1.30, h=0.34, beta=0.45, bob=0.07, pitch=2, flex=4, lift=60)},
    'goat': {'walk': dict(S=0.32, h=0.08, beta=0.62, bob=0.012, lift=34), 'run': dict(S=0.66, h=0.20, beta=0.34, bob=0.08, pitch=5, flex=9, lift=70)},
    'sheep': {'walk': dict(S=0.28, h=0.06, beta=0.64, bob=0.012, lift=30), 'run': dict(S=0.56, h=0.14, beta=0.36, bob=0.06, pitch=4, flex=7, lift=60)},
    'cow': {'walk': dict(S=0.50, h=0.09, beta=0.66, bob=0.014, lift=22), 'run': dict(S=0.90, h=0.16, beta=0.40, bob=0.05, pitch=3, flex=5, lift=45)},
}[NAME]
WALK_OFF = {'hL': 0.0, 'fL': 0.25, 'hR': 0.5, 'fR': 0.75}          # the four-beat walk: each hind foot, then the front foot on its side
RUN_OFF = {'hL': 0.0, 'hR': 0.10, 'fL': 0.47, 'fR': 0.57}          # the gallop: the hind pair, a moment in the air, the front pair
def step(n, u, G, yoff=0.0):
    L = LEGS[n]; y0, z0 = L['J'][3]; y0 += yoff; rest = math.degrees(L['rest'][2]); Sx, beta = G['S'], G['beta']; u = u % 1.0
    if u < beta: return ('w', y0 - Sx / 2 + Sx * (u / beta), z0, rest)
    v = (u - beta) / (1 - beta); e = 0.5 - 0.5 * math.cos(math.pi * v)
    return ('w', y0 + Sx / 2 - Sx * e, z0 + G['h'] * math.sin(math.pi * v), rest - G['lift'] * math.sin(math.pi * v))
TWO = 2 * math.pi
def walk(p):
    G = GAIT['walk']; w = TWO * p
    return {'loc': (0, 0, -G['bob'] * (0.5 + 0.5 * math.cos(2 * w))), 'pitch': 0.6 * math.sin(2 * w), 'hips_yaw': 2.5 * math.sin(w), 'chest_yaw': -2.5 * math.sin(w),
            'neck': 3 * math.sin(2 * w + 0.6), 'head': -2 * math.sin(2 * w + 0.6), 'wag': 6 * math.sin(w), 'tail': 3 * math.sin(2 * w),
            'legs': {n: step(n, p + o, G) for n, o in WALK_OFF.items()}}
def run(p, low=0.0, speed=1.0):
    G = GAIT['run']; w = TWO * p; fl = G['flex'] * math.cos(w - TWO * 0.92)                 # gathered as the hind feet come under, stretched as the front reach
    return {'loc': (0, 0, G['bob'] * math.sin(w - TWO * 0.30) - 0.02 - 0.03 * low), 'pitch': G['pitch'] * math.sin(w - TWO * 0.55) + 6 * low, 'hips': -fl, 'chest': fl * 0.5,
            'neck': -fl * 0.5 + 6 * math.sin(w - TWO * 0.5) + 22 * low, 'head': 4 + 10 * low, 'tail': -18 - 8 * math.sin(w), 'wag': 0,
            'legs': {n: step(n, p + o, G, yoff=(0.05 if n[0] == 'h' else -0.05)) for n, o in RUN_OFF.items()}}
def idle(p):
    w = TWO * p; br = 0.5 - 0.5 * math.cos(2 * w)
    if NAME == 'boar': return {'loc': (0, 0, -0.006 * br), 'neck': 10 + 5 * math.sin(w), 'head': 6 + 4 * math.sin(w + 0.8), 'head_yaw': 5 * math.sin(w), 'wag': 16 * math.sin(3 * w), 'tail': 6}
    if NAME == 'goat': return {'loc': (0, 0, -0.005 * br), 'neck': -2 + 3 * math.sin(w), 'neck_yaw': 12 * math.sin(w), 'head_yaw': 10 * math.sin(w + 0.5), 'head': 4 * math.sin(2 * w), 'wag': 25 * math.sin(5 * w), 'tail': -30}
    if NAME == 'sheep': return {'loc': (0, 0, -0.004 * br), 'neck': 8 + 2 * math.sin(w), 'head': 6 + 3 * math.sin(2 * w + 1), 'head_yaw': 6 * math.sin(w), 'wag': 8 * math.sin(3 * w), 'tail': 20}
    if NAME == 'cow': return {'loc': (0, 0, -0.004 * br), 'neck': 6 + 2 * math.sin(w), 'head': 4 + 2 * math.sin(2 * w + 0.6), 'head_yaw': 8 * math.sin(w * 0.5), 'wag': 18 * math.sin(2 * w), 'tail': 4 * math.sin(w)}
    if NAME == 'deer': return {'loc': (0, 0, -0.005 * br), 'neck': -3 + 2 * math.sin(w), 'neck_yaw': 14 * math.sin(w), 'head_yaw': 12 * math.sin(w + 0.5), 'head': 3 * math.sin(2 * w), 'wag': 20 * max(0, math.sin(4 * w)), 'tail': -6}
    return {'loc': (0, 0, -0.006 * br), 'neck': 3 + 2 * math.sin(w), 'head': 4 + 2 * math.sin(2 * w), 'head_yaw': 7 * math.sin(w), 'wag': 9 * math.sin(w), 'tail': 3 * math.sin(2 * w)}
def windup(p):
    w = TWO * p
    if NAME == 'boar':                              # head down, a front hoof scraping the ground
        u = (2 * p) % 1.0; L = LEGS['fL']; y0, z0 = L['J'][3]; scrape = ('w', y0 - 0.10 + 0.22 * u, z0 + 0.07 * math.sin(math.pi * min(1, u * 1.6)) * (1 if u < 0.62 else 0), -30 * math.sin(math.pi * u))
        return {'loc': (0, 0.03, -0.03), 'pitch': 5, 'neck': 24 + 4 * math.sin(2 * w), 'head': 10, 'tail': -25, 'wag': 20 * math.sin(4 * w), 'legs': {'fL': scrape}}
    if NAME == 'bear':                              # the bear rears up onto its hind legs, forepaws raised
        k = 0.5 - 0.5 * math.cos(math.pi * min(1.0, p * 1.3)); fr = lambda n, o: ('l', LEGS[n]['J'][3][0] - 0.10 * k, LEGS[n]['J'][3][1] + (0.30 + o) * k, 30 * k)
        return {'loc': (0, 0.22 * k, 0.34 * k), 'pitch': -52 * k, 'hips': 14 * k, 'neck': 26 * k, 'head': 16 * k, 'legs': {'fL': fr('fL', 0.10), 'fR': fr('fR', 0.0)} if k > 0.05 else {}}
    if NAME == 'moose':                             # the moose drops its antlers and stamps
        k = 0.5 - 0.5 * math.cos(math.pi * min(1.0, p * 1.5)); u = (2 * p) % 1.0; L = LEGS['fR']; y0, z0 = L['J'][3]
        return {'loc': (0, 0.06 * k, -0.04 * k), 'pitch': 4 * k, 'neck': 46 * k, 'head': 26 * k, 'tail': -20 * k, 'legs': {'fR': ('w', y0 - 0.08, z0 + 0.16 * math.sin(math.pi * u) * k, -30 * math.sin(math.pi * u) * k)}}
    k = 0.5 - 0.5 * math.cos(math.pi * min(1.0, p * 1.4))     # the wolf sinks into a crouch, its weight back, its head low and level
    return {'loc': (0, 0.07 * k, -0.15 * k), 'pitch': 7 * k, 'hips': -8 * k, 'neck': 26 * k, 'head': -18 * k, 'tail': -10 * k, 'wag': 4 * math.sin(3 * w)}
def attack(p):
    if NAME == 'boar': return run(p, low=1.0)        # the charge: the gallop with the head down
    if NAME == 'bear':                              # down from the rear with both forepaws: a heavy swipe, then all four on the ground
        d = min(1.0, p / 0.45); k = 1 - (d * d * (3 - 2 * d)); fr = lambda n, o: ('l', LEGS[n]['J'][3][0] - 0.10 * k - 0.30 * math.sin(math.pi * d) * (1 - k * 0.3), LEGS[n]['J'][3][1] + (0.30 + o) * k, 30 * k - 40 * math.sin(math.pi * d))
        return {'loc': (0, 0.22 * k - 0.16 * math.sin(math.pi * min(1.0, p / 0.7)), 0.34 * k - 0.05 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.4) / 0.4)))), 'pitch': -52 * k + 8 * math.sin(math.pi * min(1.0, p / 0.8)), 'hips': 14 * k, 'neck': 26 * k - 6 * math.sin(math.pi * p), 'head': 16 * k,
                'legs': {'fL': fr('fL', 0.10), 'fR': fr('fR', 0.0)} if k > 0.05 else {}}
    if NAME == 'moose':                             # the gore: the lowered antlers driven forward and thrown up
        k = math.sin(math.pi * min(1.0, p * 1.15)); up = max(0.0, math.sin(math.pi * (p - 0.25) / 0.75)) if p > 0.25 else 0.0
        return {'loc': (0, -0.28 * k, -0.04 + 0.05 * up), 'pitch': 5 - 9 * up, 'neck': 46 - 64 * up, 'head': 26 - 30 * up, 'hips': -4 * k, 'tail': -25}
    k = math.sin(math.pi * p); e = 0.5 - 0.5 * math.cos(math.pi * p)                          # the wolf's leap: up and forward, forelegs reaching, then the landing
    fr = lambda n: ('l', LEGS[n]['J'][3][0] - 0.30 * k + 0.10 * e, LEGS[n]['J'][3][1] + 0.26 * k * (1 - 0.5 * e), 25 * k)
    hn = lambda n: ('l', LEGS[n]['J'][3][0] + 0.30 * k, LEGS[n]['J'][3][1] + 0.10 * k, -45 * k)
    return {'loc': (0, -0.10 * k, 0.26 * k - 0.10 * (1 - k) * (1 - p)), 'pitch': -16 * (1 - p) * k + 12 * p * k, 'hips': 10 * k, 'chest': -6 * k, 'neck': 4 - 10 * k, 'head': -8 * k, 'tail': -30 * k,
            'legs': {'fL': fr('fL'), 'fR': fr('fR'), 'hL': hn('hL'), 'hR': hn('hR')} if k > 0.12 else {}}
def hit(p):
    k = math.sin(math.pi * min(1.0, p * 1.25)) * (1 - 0.3 * p)
    return {'loc': (0, 0.07 * k, -0.035 * k), 'pitch': -5 * k, 'roll': 5 * k, 'neck': -8 * k, 'neck_yaw': 22 * k, 'head_yaw': 14 * k, 'head_roll': 10 * k, 'tail': -20 * k}
def death(p):
    a = min(1.0, p / 0.22); stagger = math.sin(math.pi * a) * (1 - min(1.0, p / 0.3))          # a stagger, then over onto its side and still
    f = min(1.0, max(0.0, (p - 0.18) / 0.5)); f = f * f * (3 - 2 * f); settle = 0.03 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.68) / 0.2)))
    half = max(r[2] for r in torso); drop = PIV['body'][2] - half * 0.92
    fk = lambda n: ('fk', (18 if n[0] == 'f' else -8) * f + 6 * stagger, (-34 if n[0] == 'f' else 30) * f, 20 * f) if f > 0.02 else None
    legs = {n: fk(n) for n in LEGS if fk(n)}
    return {'loc': (0.10 * f, 0.04 * stagger, -drop * f + settle), 'roll': 86 * f + 7 * stagger, 'pitch': -4 * stagger, 'neck': 14 * f, 'neck_yaw': -10 * f, 'head': 8 * f, 'tail': -30 * f, 'legs': legs}

FARM = NAME in ('goat', 'sheep', 'cow')
def graze(p):                                       # the head down in the grass, nibbling, the tail flicking
    w = TWO * p; nib = 5 * math.sin(6 * w); dn = 48 if NAME == 'goat' else 44 if NAME == 'sheep' else 40
    return {'loc': (0, 0.01, -0.01), 'pitch': 3, 'chest': 2, 'neck': dn + 3 * math.sin(2 * w), 'head': 24 + nib, 'head_yaw': 6 * math.sin(w), 'wag': 12 * math.sin(3 * w), 'tail': (-30 if NAME == 'goat' else 20 if NAME == 'sheep' else 6)}
def butt(p):                                        # the goat's nudge: it gathers, drops its head and shoves forward, then stands back up
    k = 0.5 - 0.5 * math.cos(math.pi * min(1.0, p / 0.3)); sh = math.sin(math.pi * max(0.0, min(1.0, (p - 0.3) / 0.45))) if p > 0.3 else 0.0; back = max(0.0, (p - 0.75) / 0.25)
    return {'loc': (0, 0.06 * k - 0.26 * sh, -0.03 * k - 0.02 * sh), 'pitch': 6 * k + 6 * sh, 'hips': -6 * sh, 'neck': 30 * k + 20 * sh - 50 * back * (k + sh), 'head': 22 * k + 10 * sh, 'tail': -35, 'wag': 10 * math.sin(TWO * 3 * p)}
def lie(p):                                         # from standing to lying: the hind end sinks first, then the front, the legs folded under, the head up; the last frame is the lying beast
    k = p * p * (3 - 2 * p); hk = min(1.0, k * 1.4); fk_ = max(0.0, (k - 0.3) / 0.7)
    half = max(r[2] for r in torso); drop = PIV['body'][2] - half * 1.05
    fold = lambda n: ('fk', (-70 if n[0] == 'h' else 60) * (hk if n[0] == 'h' else fk_), (120 if n[0] == 'h' else -115) * (hk if n[0] == 'h' else fk_), (-40 if n[0] == 'h' else 50) * (hk if n[0] == 'h' else fk_))
    return {'loc': (0, 0.02 * k, -drop * (0.55 * hk + 0.45 * fk_)), 'pitch': -8 * hk + 8 * fk_, 'neck': 8 - 6 * k, 'head': 6, 'head_yaw': 10 * k, 'tail': 10, 'legs': {n: fold(n) for n in LEGS}}
clip('idle', 48, idle); clip('walk', 24, walk); clip('run', 12, run); clip('hit', 8, hit); clip('death', 20, death)
if FARM: clip('graze', 48, graze); clip('lie', 24, lie)
if NAME == 'goat': clip('butt', 16, butt)
if NAME != 'deer' and not FARM: clip('windup', 24 if NAME == 'boar' else 16 if NAME in ('bear', 'moose') else 12, windup); clip('attack', 16 if NAME in ('bear', 'moose') else 12, attack)
ad = rig.animation_data; ad.action = bpy.data.actions['idle']
if hasattr(ad, 'action_slot') and len(ad.action.slots): ad.action_slot = ad.action.slots[0]
sc.frame_set(1)
os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, 'parts', len(PARTS), 'actions', sorted(a.name for a in bpy.data.actions))
