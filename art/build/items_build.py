"""The things in the hero's hands, modelled and parented to the Mixamo rig (2026-10-09, Robin: weapons and tools from Blender).
Opens art/source/hero2_mixamo.blend, removes any earlier items, builds each kind as low-poly meshes in the Gear collection and
parents them to the right forearm bone (the bow to the left), then saves. Every kind is two layers for render.py: '<kind>Wood'
(the haft, grip or stave, in the wood colour) and '<kind>Metal' (the head, blade or guard, in a neutral grey the game tints by the
item's material), so one render serves every material. A bone-parented object's origin sits at the bone's tail (the wrist); GRIP
moves it into the mitten. The thing's long axis continues the forearm (the bone's local +Y: the way Mixamo's sword and axe clips
hold a weapon, blade in line with the arm; chosen from a test of all six axes, art/build/probe_grip.py), with the pommel toward the
elbow; a head set off the haft points along +Z, which is up when the axe is raised and down when the blow lands. Everything is
built along Z and turned onto Y by a quarter turn about X; the bow alone stays on Z (a stave stands across the arm) and bows back
toward the archer.   node tools/blender.js art/build/items_build.py [-- --probe]"""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE'); gear = bpy.data.collections['Gear']
RIGHT, LEFT = 'mixamorig:RightForeArm', 'mixamorig:LeftForeArm'
KINDS = ['sword', 'axe', 'pick', 'knife', 'club', 'seax', 'spear', 'bow', 'rod']
for o in list(gear.objects):
    if any(o.name.startswith(k) for k in KINDS): bpy.data.objects.remove(o)
GRIP = Vector((0.0, 0.085, 0.0))                 # from the wrist into the fist, along the forearm
COL = { 'wood': '#8a5f3c', 'metal': '#b4b8bf', 'cord': '#5a4a38', 'dark': '#4e3a28' }
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
def blade(name, mat, z0, z1, w0, w1, t, y=0.0):
    """a flat tapered blade along +Z: width w0 at z0, w1 at z1, thickness t, its flat in the Y-Z plane"""
    bm = bmesh.new()
    v = [bm.verts.new((sx * t / 2, y + sy * w0 / 2, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))] + [bm.verts.new((sx * t / 2, y + sy * w1 / 2, z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for a, b, c, d in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new((v[a], v[b], v[c], v[d]))
    return mesh_obj(name, bm, mat)
def ball(name, mat, c, r):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=r); bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)), verts=bm.verts); return mesh_obj(name, bm, mat, False)
def attach(objs, bone, along_y=True):
    for o in objs:
        o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = bone
        o.matrix_parent_inverse = Matrix.Identity(4); o.location = GRIP
        if along_y: o.rotation_euler = (-math.pi / 2, 0, 0)          # built along Z, held along the forearm's Y; a head at -Y lands on +Z

# the kinds: wood parts and metal parts, along Z with the fist at the origin
def build_axe():
    attach([cyl('axeWood_haft', MAT['wood'], (0, 0, -0.09), (0, 0, 0.46), 0.018, 0.015),                                   # the fist at the haft's foot, the head at the far end
            box('axeMetal_head', MAT['metal'], (0, -0.08, 0.40), (0.028, 0.18, 0.11)), blade('axeMetal_edge', MAT['metal'], 0.33, 0.47, 0.12, 0.17, 0.014, -0.19)], RIGHT)
def build_pick():
    attach([cyl('pickWood_haft', MAT['wood'], (0, 0, -0.09), (0, 0, 0.46), 0.018, 0.015),
            cyl('pickMetal_a', MAT['metal'], (0, 0, 0.42), (0, 0.30, 0.36), 0.022, 0.005), cyl('pickMetal_b', MAT['metal'], (0, 0, 0.42), (0, -0.30, 0.36), 0.022, 0.005)], RIGHT)
def build_sword():
    attach([cyl('swordWood_grip', MAT['dark'], (0, 0, -0.06), (0, 0, 0.055), 0.016, 0.015), ball('swordMetal_pommel', MAT['metal'], (0, 0, -0.07), 0.022),
            box('swordMetal_guard', MAT['metal'], (0, 0, 0.065), (0.016, 0.15, 0.018)), blade('swordMetal_blade', MAT['metal'], 0.075, 0.74, 0.075, 0.045, 0.018)], RIGHT)
def build_knife():
    attach([cyl('knifeWood_handle', MAT['wood'], (0, 0, -0.07), (0, 0, 0.04), 0.014, 0.013), blade('knifeMetal_blade', MAT['metal'], 0.045, 0.24, 0.05, 0.016, 0.012)], RIGHT)
def build_seax():
    attach([cyl('seaxWood_handle', MAT['wood'], (0, 0, -0.08), (0, 0, 0.04), 0.015, 0.014), blade('seaxMetal_blade', MAT['metal'], 0.045, 0.42, 0.06, 0.018, 0.014)], RIGHT)
def build_club():
    attach([cyl('clubWood_a', MAT['wood'], (0, 0, -0.10), (0, 0, 0.42), 0.02, 0.045, seg=10), ball('clubWood_knob', MAT['wood'], (0, 0, 0.43), 0.05)], RIGHT)
def build_spear():
    attach([cyl('spearWood_shaft', MAT['wood'], (0, 0, -0.65), (0, 0, 0.95), 0.014, 0.013), blade('spearMetal_head', MAT['metal'], 0.95, 1.22, 0.055, 0.004, 0.012)], RIGHT)
def build_rod():
    attach([cyl('rodWood_a', MAT['wood'], (0, 0, -0.15), (0, 0, 1.3), 0.012, 0.004, seg=6)], RIGHT)
def build_bow():
    # the stave is an arc in the Y-Z plane bowed toward -Y (away from the archer), held in the left fist at its middle; the string straight
    pts = []; n = 10
    for i in range(n + 1):
        t = i / n; z = -0.6 + 1.2 * t; y = -0.16 * (1 - math.sin(math.pi * t)); pts.append((0, y, z))
    objs = [cyl('bowWood_%d' % i, MAT['wood'], pts[i], pts[i + 1], 0.013 if abs(i - n / 2) < 2 else 0.009, 0.009, seg=6) for i in range(n)]
    objs.append(cyl('bowWood_string', MAT['cord'], pts[0], pts[-1], 0.003, 0.003, seg=4))
    attach(objs, LEFT, False)
for fn in (build_axe, build_pick, build_sword, build_knife, build_seax, build_club, build_spear, build_rod, build_bow): fn()
# the items start hidden in renders; render.py's layer setup shows the chosen one
for o in gear.objects:
    if any(o.name.startswith(k) for k in KINDS): o.hide_render = True
out = os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')); bpy.ops.wm.save_as_mainfile(filepath=out)
print('items built:', sorted(set(o.name.split('_')[0] for o in gear.objects)), 'saved', out)
