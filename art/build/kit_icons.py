"""Icons for the hero kit's things to wear (2026-10-20; Robin, after playing chapter 1: the Character panel's icons "look too plain
and ugly"; they were outline shapes drawn in code). Each garment, hat, piece of armour and the shields rendered alone from the
kit's own meshes, in the rest pose (a tunic laid out as a tunic), turned a little and seen from a little above, framed by its own
bounds, 128 px, transparent: the same look as the things in the hand (items_icons.py). The cloth ones are near white, as their
layers are, for the game to colour with the item's colour.
  node tools/blender.js art/build/kit_icons.py -- <hero_kit.blend> <out dir>"""
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
import bmesh
from mathutils import Vector, Matrix
argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(argv[0])); OUT = os.path.abspath(argv[1]); os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene; vl = bpy.context.view_layer; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
body = bpy.data.collections['Body']; gear = bpy.data.collections['Gear']
toon.restyle('cel'); toon.world(sc, style='cel'); toon.sun('cel'); toon.set_scene('day')
SIZE, PX = 128, 1; toon.setup_render(sc, SIZE, PX, 16)
rig.data.pose_position = 'REST'; (rig.parent or rig).rotation_euler = (0, 0, math.radians(-28)); vl.update()
for o in body.objects: o.hide_render = True
ICONS = {   # icon: (the layer prefixes shown, the camera's height in degrees, the turn in degrees)
  'tunic': (['tunic'], 18, -28), 'legs': (['legs'], 12, 0), 'shoes': (['shoes'], 30, -28), 'boots': (['boots'], 25, -28), 'belt': (['belt'], 35, -28),
  'coat': (['coat'], 18, -28), 'mail': (['mail'], 18, -28), 'cloak': (['cloak'], 24, 160),
  'capA': (['capA'], 22, -28), 'capB': (['capB'], 22, -28), 'capC': (['capC'], 22, -28), 'helmA': (['helmA'], 20, -28), 'helmB': (['helmB'], 20, -28), 'helmC': (['helmC'], 22, -28),
  'hoodA': (['hoodA'], 20, -28), 'hoodB': (['hoodB'], 20, -28), 'hoodC': (['hoodC'], 25, -28),
  'shield_wood': (['shieldRim', 'shieldFace'], 72, -28), 'shield_painted': (['shieldRim', 'shieldFace', 'shieldMark'], 72, -28),
  'armring': (['icon_armring'], 55, 0), 'brooch': (['icon_brooch'], 60, 0)}
def ring(name, matname, R0, r, gap=0.0, z=5.0):
    """a ring for an icon (the layers' own are bands round the arm or the shoulder): a tube round a circle, open by 'gap' radians"""
    bm = bmesh.new(); n, k = 40, 10; a0 = gap / 2; a1 = 2 * math.pi - gap / 2; rings = []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n; c = Vector((math.cos(a) * R0, math.sin(a) * R0, z)); out = Vector((math.cos(a), math.sin(a), 0))
        rings.append([bm.verts.new(c + out * math.cos(2 * math.pi * j / k) * r + Vector((0, 0, math.sin(2 * math.pi * j / k) * r))) for j in range(k)])
    for i in range(n):
        for j in range(k): bm.faces.new((rings[i][j], rings[i][(j + 1) % k], rings[i + 1][(j + 1) % k], rings[i + 1][j]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(bpy.data.materials[matname])
    for pl in me.polygons: pl.use_smooth = True
    o = bpy.data.objects.new(name, me); gear.objects.link(o); return o
ring('icon_armring', 'k_ring', 0.05, 0.011)
ring('icon_brooch_ring', 'k_bronze', 0.045, 0.008, gap=0.7, z=5.0)
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.006, radius2=0.002, depth=0.13, matrix=Matrix.Translation((0.0, 0.0, 5.012)) @ Matrix.Rotation(math.radians(80), 4, 'Y') @ Matrix.Rotation(math.radians(20), 4, 'X'))
me = bpy.data.meshes.new('icon_brooch_pin'); bm.to_mesh(me); bm.free(); me.materials.append(bpy.data.materials['k_bronze']); o = bpy.data.objects.new('icon_brooch_pin', me); gear.objects.link(o)
dg = bpy.context.evaluated_depsgraph_get()
for name, (prefixes, elev, turn) in ICONS.items():
    (rig.parent or rig).rotation_euler = (0, 0, math.radians(turn))
    objs = [o for o in gear.objects if any(o.name.startswith(p + '_') or o.name == p for p in prefixes) and not o.name.startswith(('hairHat',))]
    if name == 'brooch': objs = [o for o in gear.objects if o.name.startswith('icon_brooch')]
    if name == 'armring': objs = [o for o in gear.objects if o.name == 'icon_armring']
    if name.startswith('cap') or name.startswith('helm') or name.startswith('hood'): objs = [o for o in gear.objects if o.name.startswith(name + '_')]
    for o in gear.objects: o.hide_render = o not in objs; o.is_holdout = False
    if not objs: print('no meshes for', name); continue
    vl.update(); dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in objs:
        ev = o.evaluated_get(dg); me = ev.to_mesh(); pts += [ev.matrix_world @ v.co for v in me.vertices]; ev.to_mesh_clear()
    centre = sum(pts, Vector()) / len(pts); radius = max((p - centre).length for p in pts)
    for ob in [o for o in sc.objects if o.type == 'CAMERA']: bpy.data.objects.remove(ob)
    cam = toon.camera(sc, elev, radius * 2.15, 0); look = cam.rotation_euler.to_matrix() @ Vector((0, 0, -1)); cam.location = centre - look * 10
    toon.freestyle(sc, vl, PX, gear, 'cel')
    sc.render.filepath = os.path.join(OUT, name + '.png'); bpy.ops.render.render(write_still=True)
    print('icon', name, 'radius %.2f' % radius)
print('KIT ICONS in', OUT)
