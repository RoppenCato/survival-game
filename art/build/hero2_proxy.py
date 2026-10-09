"""A rigging proxy for Mixamo (2026-10-09): Mixamo's auto-rigger failed on the hero's own mesh (many separate shells with n-gon
caps: "Unknown error while generating motion"), so this joins every body part of hero2.blend into one object, voxel-remeshes
it into a single watertight surface, decimates it to a few thousand triangles and exports it in the T-pose as
art/source/hero2_rigproxy.fbx. Only the skeleton Mixamo fits to this proxy is wanted; the real parts are bound to that
skeleton afterwards (art/build/mixamo_bind.py).   node tools/blender.js art/build/hero2_proxy.py"""
import bpy, bmesh, os, sys
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2.blend')))
sc = bpy.context.scene; body = bpy.data.collections['Body']
bm = bmesh.new()
for o in body.objects:
    me = o.data.copy(); me.transform(o.matrix_world); bm.from_mesh(me); bpy.data.meshes.remove(me)
me = bpy.data.meshes.new('RigProxy'); bm.to_mesh(me); bm.free()
j = bpy.data.objects.new('RigProxy', me); sc.collection.objects.link(j)
for ob in sc.objects: ob.select_set(False)
j.select_set(True); bpy.context.view_layer.objects.active = j
rm = j.modifiers.new('remesh', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.012; rm.use_smooth_shade = True
bpy.ops.object.modifier_apply(modifier='remesh')
print('remeshed faces', len(j.data.polygons))
dc = j.modifiers.new('decimate', 'DECIMATE'); dc.ratio = max(0.02, 6000 / max(1, len(j.data.polygons))); dc.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier='decimate')
tr = j.modifiers.new('tri', 'TRIANGULATE'); bpy.ops.object.modifier_apply(modifier='tri')
print('proxy faces', len(j.data.polygons), 'verts', len(j.data.vertices))
mat = bpy.data.materials.new('proxy'); me.materials.append(mat)
out = os.path.abspath(os.path.join(SRC, 'hero2_rigproxy.fbx'))
bpy.ops.export_scene.fbx(filepath=out, use_selection=True, apply_scale_options='FBX_SCALE_ALL', path_mode='AUTO', add_leaf_bones=False)
print('exported', out)
