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
def build_axe():
    head = [(0.03, 0.575), (-0.035, 0.58), (-0.14, 0.605), (-0.178, 0.565), (-0.188, 0.50), (-0.172, 0.425), (-0.148, 0.36), (-0.095, 0.40), (-0.062, 0.46), (-0.042, 0.50), (-0.036, 0.51), (0.03, 0.515)]
    attach([cyl('axeWood_haft', MAT['wood'], (0, 0, -0.09), (0, 0, 0.60), 0.019, 0.016),
            cyl('axeWood_wedge', MAT['dark'], (0, 0, 0.59), (0, 0, 0.605), 0.014, 0.012, seg=6),                                 # the wedge that holds the head
            poly('axeMetal_head', MAT['metal'], head, 0.02)], RIGHT)
def build_greataxe():                       # the Dane axe (2026-10-13, as the people's): a long haft, a broad thin crescent set off toward +Z
    head = [(0.03, 0.88), (-0.04, 0.885), (-0.20, 0.945), (-0.262, 0.885), (-0.278, 0.78), (-0.255, 0.665), (-0.19, 0.59), (-0.10, 0.70), (-0.06, 0.78), (-0.04, 0.815), (0.03, 0.82)]
    attach([cyl('greataxeWood_haft', MAT['wood'], (0, 0, -0.34), (0, 0, 0.90), 0.018, 0.016), cyl('greataxeWood_wedge', MAT['dark'], (0, 0, 0.89), (0, 0, 0.905), 0.013, 0.011, seg=6),
            poly('greataxeMetal_head', MAT['metal'], head, 0.016)], RIGHT)
def build_pick():
    attach([cyl('pickWood_haft', MAT['wood'], (0, 0, -0.09), (0, 0, 0.50), 0.019, 0.016),
            box('pickMetal_socket', MAT['metal'], (0, 0, 0.46), (0.034, 0.07, 0.07)),
            cyl('pickMetal_point', MAT['metal'], (0, -0.03, 0.46), (0, -0.30, 0.40), 0.024, 0.004),                              # one point, curving a little down
            box('pickMetal_hammer', MAT['metal'], (0, 0.06, 0.46), (0.034, 0.06, 0.05))], RIGHT)                                    # a hammer face behind
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
def build_spear():
    head = [(0.0, 1.02), (0.034, 1.09), (0.032, 1.17), (0.016, 1.26), (0.0, 1.30), (-0.016, 1.26), (-0.032, 1.17), (-0.034, 1.09)]
    attach([cyl('spearWood_shaft', MAT['wood'], (0, 0, -0.65), (0, 0, 0.96), 0.014, 0.013),
            cyl('spearMetal_socket', MAT['metal'], (0, 0, 0.94), (0, 0, 1.03), 0.019, 0.016), poly('spearMetal_head', MAT['metal'], head, 0.011),
            cyl('spearMetal_rib', MAT['metal'], (0, 0, 1.03), (0, 0, 1.26), 0.0085, 0.004, seg=6)], RIGHT)
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
# the items start hidden in renders; render.py's layer setup shows the chosen one
for o in gear.objects:
    if any(o.name.startswith(k) for k in KINDS): o.hide_render = True
out = os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')); bpy.ops.wm.save_as_mainfile(filepath=out)
print('items built:', sorted(set(o.name.split('_')[0] for o in gear.objects)), 'saved', out)
