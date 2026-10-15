"""The things in the hero's hands, modelled and parented to the Mixamo rig (2026-10-09, Robin: weapons and tools from Blender;
2026-10-13, the studio, Robin: upgrade all the weapons so they fit the art direction and look like Viking weapons).
Opens art/source/hero2_mixamo.blend, removes any earlier items, builds each kind as low-poly meshes in the Gear collection and
parents them to the right forearm bone (the bow to the left), then saves. Every kind is two layers for render.py: '<kind>Wood'
(the haft, grip or stave, and the hilt's bronze: what the game draws as it is) and '<kind>Metal' (the head, blade or guard, in a
neutral grey the game tints by the item's material), so one render serves every material. A bone-parented object's origin sits
at the bone's tail (the wrist); GRIP moves it into the mitten. The thing's long axis continues the forearm (the bone's local +Y:
the way Mixamo's sword and axe clips hold a weapon, blade in line with the arm; chosen from a test of all six axes,
art/build/probe_grip.py), with the pommel toward the elbow; a head set off the haft points along +Z, which is up when the axe
is raised and down when the blow lands. Everything is built along Z and turned onto Y by a quarter turn about X; the bow alone
stays on Z (a stave stands across the arm) and bows back toward the archer.

The shapes, after the finds (2026-10-13): the sword a Viking blade, broad and nearly parallel with a rounded point and a fuller,
a short thick lower guard, a bar of an upper guard and a three-lobed pommel, the grip wrapped; the axe a bearded axe (skeggøx),
the beard dropping well below the socket; the Dane axe a broad thin crescent on a long haft; the spear a leaf blade with a midrib
on a socket; the seax and the knife broken-backed and single-edged, horn handled; the club a root with its knots; the pick a
miner's pick with one point and a hammer face; the bow a longbow with nocks and a wrapped grip. Blades and heads are cut from an
outline (poly), so each is one silhouette with one ink line.   node tools/blender.js art/build/items_build.py"""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE'); gear = bpy.data.collections['Gear']
RIGHT, LEFT = 'mixamorig:RightForeArm', 'mixamorig:LeftForeArm'
KINDS = ['sword', 'axe', 'pick', 'knife', 'club', 'seax', 'spear', 'bow', 'rod', 'greataxe']
for o in list(gear.objects):
    if any(o.name.startswith(k) for k in KINDS): bpy.data.objects.remove(o)
GRIP = Vector((0.0, 0.085, 0.0))                 # from the wrist into the fist, along the forearm
COL = {'wood': '#7d5636', 'metal': '#b4b8bf', 'fuller': '#8f949b', 'cord': '#4e3f30', 'dark': '#45331f', 'bronze': '#b08a3a', 'horn': '#5c4a3a'}
MAT = {}
for k, v in COL.items(): MAT[k] = toon.material('item_' + k, v, None, 'cel')

def mesh_obj(name, bm, mat, flat=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = not flat
    o = bpy.data.objects.new(name, me); gear.objects.link(o); return o
def cyl(name, mat, p0, p1, r0, r1, seg=8, flat=False):
    """a tapered cylinder from p0 to p1 (local coordinates)"""
    bm = bmesh.new(); d = Vector(p1) - Vector(p0); L = d.length
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r1, depth=L)
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(p0) + d / 2) @ rot, verts=bm.verts)
    return mesh_obj(name, bm, mat, flat)
def box(name, mat, c, size, rot=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    M = Matrix.Translation(Vector(c)) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((size[0], size[1], size[2], 1.0))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts); return mesh_obj(name, bm, mat)
def poly(name, mat, pts, t, flat=True):
    """an outline (y, z) in the blade's plane, extruded t thick along X: a blade, an axe head, a spearhead as one shape"""
    bm = bmesh.new(); a = [bm.verts.new((-t / 2, y, z)) for (y, z) in pts]; b = [bm.verts.new((t / 2, y, z)) for (y, z) in pts]
    n = len(pts); fa = bm.faces.new(a[::-1]); fb = bm.faces.new(b)
    for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bmesh.ops.triangulate(bm, faces=[fa, fb]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, mat, flat)
def ball(name, mat, c, r, sx=1.0, sy=1.0, sz=1.0):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=r)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((sx, sy, sz, 1.0)), verts=bm.verts); return mesh_obj(name, bm, mat, False)
def attach(objs, bone, along_y=True):
    for o in objs:
        o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = bone
        o.matrix_parent_inverse = Matrix.Identity(4); o.location = GRIP
        if along_y: o.rotation_euler = (-math.pi / 2, 0, 0)          # built along Z, held along the forearm's Y; a head at -Y lands on +Z

# the kinds: wood parts and metal parts, along Z with the fist at the origin; an edge or a head faces -Y
def build_sword():
    blade = [(-0.028, 0.065), (0.028, 0.065), (0.025, 0.40), (0.022, 0.62), (0.012, 0.76), (0.0, 0.80), (-0.012, 0.76), (-0.022, 0.62), (-0.025, 0.40)]
    attach([cyl('swordWood_grip', MAT['cord'], (0, 0, -0.06), (0, 0, 0.052), 0.0165, 0.015, seg=8),
            cyl('swordWood_gripmid', MAT['cord'], (0, 0, -0.02), (0, 0, 0.012), 0.0185, 0.0185, seg=8),                        # the swell of the wrap under the fingers
            box('swordWood_guard', MAT['bronze'], (0, 0, 0.058), (0.028, 0.13, 0.022)),                                        # the lower guard: short and thick
            box('swordWood_upper', MAT['bronze'], (0, 0, -0.072), (0.026, 0.095, 0.017)),                                       # the upper guard
            ball('swordWood_pommel', MAT['bronze'], (0, 0, -0.098), 0.024, 1.0, 1.0, 0.85), ball('swordWood_lobeA', MAT['bronze'], (0, 0.033, -0.091), 0.017, 0.9, 1.0, 0.8), ball('swordWood_lobeB', MAT['bronze'], (0, -0.033, -0.091), 0.017, 0.9, 1.0, 0.8),   # the three lobes
            poly('swordMetal_blade', MAT['metal'], blade, 0.012),
            poly('swordMetal_fuller', MAT['fuller'], [(-0.008, 0.09), (0.008, 0.09), (0.007, 0.60), (-0.007, 0.60)], 0.0135)], RIGHT)   # the groove, a shade darker, showing on both faces
def build_axe():                            # 2026-10-15: the haft 0.58 m (was 0.69), so the head hangs clear of the ground from a hanging arm
    head = [(0.03, 0.475), (-0.035, 0.48), (-0.14, 0.505), (-0.178, 0.465), (-0.188, 0.40), (-0.172, 0.325), (-0.148, 0.26), (-0.095, 0.30), (-0.062, 0.36), (-0.042, 0.40), (-0.036, 0.41), (0.03, 0.415)]
    attach([cyl('axeWood_haft', MAT['wood'], (0, 0, -0.08), (0, 0, 0.50), 0.019, 0.016),
            cyl('axeWood_wedge', MAT['dark'], (0, 0, 0.49), (0, 0, 0.505), 0.014, 0.012, seg=6),                                 # the wedge that holds the head
            poly('axeMetal_head', MAT['metal'], head, 0.02)], RIGHT)
def build_greataxe():                       # the Dane axe (2026-10-13, as the people's): a long haft, a broad thin crescent set off toward +Z
    head = [(0.03, 0.88), (-0.04, 0.885), (-0.20, 0.945), (-0.262, 0.885), (-0.278, 0.78), (-0.255, 0.665), (-0.19, 0.59), (-0.10, 0.70), (-0.06, 0.78), (-0.04, 0.815), (0.03, 0.82)]
    attach([cyl('greataxeWood_haft', MAT['wood'], (0, 0, -0.34), (0, 0, 0.90), 0.018, 0.016), cyl('greataxeWood_wedge', MAT['dark'], (0, 0, 0.89), (0, 0, 0.905), 0.013, 0.011, seg=6),
            poly('greataxeMetal_head', MAT['metal'], head, 0.016)], RIGHT)
def build_pick():                           # 2026-10-15 (Robin): a classic two-headed pickaxe: a bowed head, two points curving down to their tips, the eye round the haft
    half = [(0.04, 0.47), (0.12, 0.465), (0.20, 0.44), (0.27, 0.395), (0.29, 0.36), (0.26, 0.37), (0.19, 0.40), (0.12, 0.415), (0.04, 0.42)]
    head = [(y, z) for (y, z) in half] + [(-y, z) for (y, z) in reversed(half)]                                                    # the right point, then the left, one outline
    attach([cyl('pickWood_haft', MAT['wood'], (0, 0, -0.08), (0, 0, 0.47), 0.019, 0.016),
            poly('pickMetal_head', MAT['metal'], head, 0.028),
            box('pickMetal_eye', MAT['metal'], (0, 0, 0.445), (0.04, 0.085, 0.06))], RIGHT)                                       # the eye the haft passes through
def build_seax():
    blade = [(0.012, 0.045), (0.012, 0.30), (-0.02, 0.42), (-0.032, 0.30), (-0.03, 0.045)]
    attach([cyl('seaxWood_handle', MAT['horn'], (0, 0, -0.085), (0, 0, 0.045), 0.016, 0.014, seg=8), cyl('seaxWood_ferrule', MAT['bronze'], (0, 0, 0.038), (0, 0, 0.048), 0.0165, 0.0165, seg=8), ball('seaxWood_butt', MAT['bronze'], (0, 0, -0.088), 0.014),
            poly('seaxMetal_blade', MAT['metal'], blade, 0.009)], RIGHT)
def build_knife():
    blade = [(0.008, 0.04), (0.008, 0.17), (-0.012, 0.24), (-0.022, 0.17), (-0.02, 0.04)]
    attach([cyl('knifeWood_handle', MAT['horn'], (0, 0, -0.07), (0, 0, 0.04), 0.014, 0.012, seg=8), cyl('knifeWood_wrap', MAT['cord'], (0, 0, -0.04), (0, 0, 0.01), 0.015, 0.015, seg=8),
            poly('knifeMetal_blade', MAT['metal'], blade, 0.008)], RIGHT)
def build_club():
    attach([cyl('clubWood_a', MAT['wood'], (0, 0, -0.10), (0, 0, 0.40), 0.02, 0.042, seg=10), ball('clubWood_knob', MAT['wood'], (0, 0, 0.42), 0.055, 1.0, 1.1, 0.9),
            ball('clubWood_burlA', MAT['wood'], (0, -0.035, 0.37), 0.028), ball('clubWood_burlB', MAT['wood'], (0, 0.04, 0.44), 0.025), ball('clubWood_burlC', MAT['wood'], (0.03, 0.0, 0.46), 0.022),   # a root's knots
            ball('clubWood_knotA', MAT['dark'], (0.02, -0.02, 0.18), 0.012), ball('clubWood_knotB', MAT['dark'], (-0.02, 0.015, 0.30), 0.011)], RIGHT)
def build_spear():                          # 2026-10-15: 1.74 m (was 1.95), so it fits the frame carried upright and reaches less far out of it in a thrust
    head = [(0.0, 0.96), (0.034, 1.03), (0.032, 1.11), (0.016, 1.20), (0.0, 1.24), (-0.016, 1.20), (-0.032, 1.11), (-0.034, 1.03)]
    attach([cyl('spearWood_shaft', MAT['wood'], (0, 0, -0.50), (0, 0, 0.90), 0.014, 0.013),
            cyl('spearMetal_socket', MAT['metal'], (0, 0, 0.88), (0, 0, 0.97), 0.019, 0.016), poly('spearMetal_head', MAT['metal'], head, 0.011),
            cyl('spearMetal_rib', MAT['metal'], (0, 0, 0.97), (0, 0, 1.20), 0.0085, 0.004, seg=6)], RIGHT)
def build_rod():
    attach([cyl('rodWood_a', MAT['wood'], (0, 0, -0.15), (0, 0, 1.3), 0.012, 0.004, seg=6)], RIGHT)
def build_bow():
    # the stave is an arc in the Y-Z plane bowed toward -Y (away from the archer), held in the left fist at its middle; the string straight
    pts = []; n = 10
    for i in range(n + 1):
        t = i / n; z = -0.62 + 1.24 * t; y = -0.16 * (1 - math.sin(math.pi * t)); pts.append((0, y, z))
    objs = [cyl('bowWood_%d' % i, MAT['wood'], pts[i], pts[i + 1], 0.016 if abs(i - n / 2) < 2 else 0.011, 0.010, seg=6) for i in range(n)]
    objs.append(cyl('bowWood_grip', MAT['cord'], (0, -0.002, -0.07), (0, -0.002, 0.07), 0.019, 0.019, seg=8))
    objs.append(ball('bowWood_nockA', MAT['dark'], pts[0], 0.013)); objs.append(ball('bowWood_nockB', MAT['dark'], pts[-1], 0.013))
    objs.append(cyl('bowWood_string', MAT['cord'], pts[0], pts[-1], 0.003, 0.003, seg=4))
    attach(objs, LEFT, False)
for fn in (build_axe, build_pick, build_sword, build_knife, build_seax, build_club, build_spear, build_rod, build_bow, build_greataxe): fn()
# --rest and --tilt (2026-10-15; Robin, through the game's session: the Dane axe and the spear hung into the ground when he stood,
# walked and ran, and "he's holding them a bit far down on the grip, like at the bottom; wouldn't that be uncomfortable?").
# The rig has no hand bones (Mixamo's No Fingers skeleton: the hands ride on the forearms), so there is no wrist to give back;
# what can change is the grip per kind and per use. Two more files are saved beside hero2_mixamo.blend:
#   rest   for idle, walk and run: the sword, seax, knife and club hang tilted forward of the arm's line, as a wrist would hold
#          them; the axe and the pick are held choked up under the head, the head out at the hip and the haft hanging; the
#          Dane axe and the spear stand upright beside him, the shaft through the fist, on the world's up whatever the arm does
#          (a Child Of on an empty in the fist for the place, a Copy Rotation from the rig for the way up and the facing), the
#          butt just above the ground, the head up by the shoulder, the crescent forward
#   tilt   for the fight clips: every thing in the right hand cocked toward the knuckles by TILT degrees, so the blade leads the
#          arm in a blow instead of continuing it like a stick taped on
# The layer names are the same, so the game needs no wiring: it is a matter of which file a clip is rendered from.
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = next((x for x in ARGS if x in ('rest', 'carry', 'tilt') or x.startswith('chop')), None); MODE = 'rest' if MODE == 'carry' else MODE
TILT = 20.0; CANT = 12.0
def kind_of(o): return o.name.split('Wood')[0] if 'Wood' in o.name else o.name.split('Metal')[0]
if MODE == 'rest':
    fist = bpy.data.objects.new('carryFist', None); gear.objects.link(fist); fist.parent = rig; fist.parent_type = 'BONE'; fist.parent_bone = RIGHT; fist.matrix_parent_inverse = Matrix.Identity(4); fist.location = GRIP
    carry = bpy.data.objects.new('carryR', None); gear.objects.link(carry)
    c = carry.constraints.new('CHILD_OF'); c.target = fist; c.inverse_matrix = Matrix.Identity(4)                  # Blender sets an inverse at creation that would leave the empty at the origin
    for ax in 'xyz': setattr(c, 'use_rotation_' + ax, False); setattr(c, 'use_scale_' + ax, False)
    r = carry.constraints.new('COPY_ROTATION'); r.target = rig; r.owner_space = 'WORLD'; r.target_space = 'WORLD'
    for o in gear.objects:
        k = kind_of(o)
        if k in ('spear', 'greataxe'):
            o.parent = carry; o.parent_type = 'OBJECT'; o.matrix_parent_inverse = Matrix.Identity(4); o.location = (-0.025, 0.0, 0.0); o.rotation_euler = (-math.pi / 2, math.radians(45), math.radians(CANT))   # carry space: Y up, Z forward, -X his right; the head turned 45 degrees so it reads from every side (Robin: edge-on it was a stick), the shaft canted out
        elif k in ('sword', 'seax', 'knife', 'club'):
            o.rotation_euler = (-math.pi / 2, 0, -math.radians(25))                                                  # tilted forward of the arm's line (the bone's +X is forward with the arm hanging)
        # the axe and the pick keep the grip along the arm (Robin, 2026-10-15: the choked grip hid what he holds; the shorter haft keeps the head off the ground)
elif MODE and MODE.startswith('chop'):                                                                     # chop<degrees>: the axe and the pick turned about the haft, for the chop and mine clips
    for o in gear.objects:
        if kind_of(o) in ('axe', 'pick'): o.rotation_euler = (-math.pi / 2, math.radians(float(MODE[4:] or 0)), 0)
elif MODE == 'tilt':
    for o in gear.objects:
        if kind_of(o) in ('sword', 'axe', 'pick', 'knife', 'club', 'seax', 'spear', 'greataxe'): o.rotation_euler = (-math.pi / 2 + math.radians(TILT), 0, 0)
# the items start hidden in renders; render.py's layer setup shows the chosen one
for o in gear.objects:
    if any(o.name.startswith(k) for k in KINDS): o.hide_render = True
out = os.path.abspath(os.path.join(SRC, 'hero2_mixamo_%s.blend' % MODE if MODE else 'hero2_mixamo.blend')); bpy.ops.wm.save_as_mainfile(filepath=out)
print('items built:', sorted(set(o.name.split('_')[0] for o in gear.objects)), 'saved', out)
