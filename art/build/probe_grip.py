"""Three test swords along the forearm bone's local X, Y and Z, saved to a scratch blend, to pick the grip axis (2026-10-09)."""
import bpy, bmesh, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE'); gear = bpy.data.collections['Gear']
for o in list(gear.objects): bpy.data.objects.remove(o)
mat = toon.material('item_metal', '#b4b8bf', None, 'cel')
def bar(name, axis):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.02, radius2=0.006, depth=0.8)
    rot = Vector((0, 0, 1)).rotation_difference(Vector(axis)).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=rot @ Matrix.Translation((0, 0, 0.35)), verts=bm.verts)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); me.materials.append(mat); o = bpy.data.objects.new(name, me); gear.objects.link(o)
    o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = 'mixamorig:RightForeArm'; o.matrix_parent_inverse = Matrix.Identity(4); o.location = Vector((0, 0.085, 0)); o.hide_render = True
bar('gX', (1, 0, 0)); bar('gY', (0, 1, 0)); bar('gZ', (0, 0, 1)); bar('gNX', (-1, 0, 0)); bar('gNZ', (0, 0, -1))
out = os.path.abspath(os.path.join(SRC, 'hero2_grip_test.blend')); bpy.ops.wm.save_as_mainfile(filepath=out); print('saved', out)
