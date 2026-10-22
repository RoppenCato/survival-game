"""The things in the hand as icons, remade (2026-10-22; Robin: "Yeah do it", after the studio showed the weapon icons as thin
needles and heads without hafts). Each weapon is taken from the hero kit's own file (so the icon is what he holds), laid along X
with its head or tip to the right and an axe's edge up, framed by its own length so it fills the picture, made a little broader
across (a sword's blade, a spear's shaft and a rod are stylised wider: at slot size their true width was a hair), and drawn in
the chosen tones with a bolder outline. The game lays the picture across the slot's diagonal (Items.icon: rotate -45 degrees,
side 1.42 of the slot), so the head ends up at the upper right. Two pictures a kind with the same framing: the wood (every part
that is not metal: haft, grip, guard, horn, cord) and the metal, which the game tints by its material; the metal is cut where a
wooden part lies in front of it.
  node tools/blender.js weapon_icons.py -- <hero_kit.blend> <out dir>
Writes <kind>_wood.png and <kind>_metal.png at 160 px (rendered at 320 and halved by Blender's own filter)."""
import bpy, os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'
from mathutils import Vector, Matrix
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
BLEND, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1]); os.makedirs(OUT, exist_ok=True)
ONLY = argv[2].split(',') if len(argv) > 2 else None
# kind: (the part that gives the length, how much broader across, margin share)
KINDS = {'sword': ('swordMetal_blade', 1.55), 'axe': ('axeWood_haft', 1.15), 'greataxe': ('greataxeWood_haft', 1.45), 'knife': ('knifeMetal_blade', 1.2),
         'seax': ('seaxMetal_blade', 1.25), 'spear': ('spearWood_shaft', 2.3), 'club': ('clubWood_a', 1.1), 'pick': ('pickWood_haft', 1.1),
         'bow': ('bowWood_string', 1.35), 'rod': ('rodWood_a', 2.8)}
SIZE, PX = 160, 2
_HAFT_UNUSED = {'axe': 1.6, 'greataxe': 1.7, 'pick': 1.6, 'spear': 1.25, 'club': 1.0, 'rod': 1.0, 'sword': 1.3, 'knife': 1.2, 'seax': 1.2, 'bow': 1.6}   # hafts, grips and the bow's stave thicker round their own line: at slot size a true haft was a dark hair
bpy.ops.wm.open_mainfile(filepath=BLEND)
sc = bpy.context.scene; vl = bpy.context.view_layer
rig = next(o for o in sc.objects if o.type == 'ARMATURE')
ICON_HEX = {'item_wood': '#b0845a', 'item_cord': '#9a8462', 'item_horn': '#cdb894', 'item_dark': '#6a5440', 'item_bronze': '#c99a44', 'item_metal': '#d4d8dd', 'item_fuller': '#a9afb7'}
for m in bpy.data.materials:                                               # the icons lighter than the held things: in a dark slot the kit's dark wood, cord and horn read as black
    if m.name in ICON_HEX: m['hex'] = ICON_HEX[m.name]
toon.restyle('cel'); toon.world(sc, style='cel'); toon.sun('cel')
toon.setup_render(sc, SIZE, PX, 16)
if rig.animation_data: rig.animation_data.action = None
for pb in rig.pose.bones: pb.matrix_basis = Matrix.Identity(4)
vl.update()
for o in sc.objects:
    if o.type == 'MESH': o.hide_render = True
cam_d = bpy.data.cameras.new('IconCam'); cam_d.type = 'ORTHO'; cam = bpy.data.objects.new('IconCam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
cam.rotation_euler = (math.pi / 2, 0, 0)                                   # looking along +Y: X to the right, Z up
gear = bpy.data.collections.new('IconGear'); sc.collection.children.link(gear)
hold = bpy.data.collections.new('IconHold'); sc.collection.children.link(hold)   # the wooden parts while the metal is drawn: held out, and given no line
fs = toon.freestyle(sc, vl, PX, gear, 'cel', weight=1.0); toon.inner_at_colours(fs)

def verts_world(objs):
    return [o.matrix_world @ v.co for o in objs for v in o.data.vertices]
for kind, (axis_part, broad) in KINDS.items():
    if ONLY and kind not in ONLY: continue
    objs = [o for o in bpy.data.objects if o.type == 'MESH' and (o.name.startswith(kind + 'Wood') or o.name.startswith(kind + 'Metal'))]
    if not objs: print('ICON none for', kind); continue
    def axes(pts):                                                          # principal axes, longest first
        A = np.array([p[:] for p in pts]); A = A - A.mean(0); w, v = np.linalg.eigh(A.T @ A); return [Vector(v[:, i]) for i in (2, 1, 0)]
    L = axes(verts_world([bpy.data.objects[axis_part]]))[0].normalized()
    P = verts_world(objs); C = sum(P, Vector()) / len(P)
    metal = [o for o in objs if (kind + 'Metal') in o.name]
    wide = verts_world(metal) if metal else P                                  # the breadth: the widest spread across the length (a blade's width, a head's height)
    A = np.array([(p - (p.dot(L)) * L)[:] for p in wide]); A = A - A.mean(0); w, v = np.linalg.eigh(A.T @ A); Wd = Vector(v[:, 2]).normalized()
    Wd = (Wd - Wd.dot(L) * L).normalized()
    if metal and kind not in ('pick',):
        head = sum(verts_world(metal), Vector()) / len(verts_world(metal))
        if (head - C).dot(L) < 0: L = -L                                  # the head or the tip to the right
    else:
        hand = rig.matrix_world @ rig.pose.bones['mixamorig:RightHand' if kind != 'bow' else 'mixamorig:LeftHand'].head
        far = max(P, key=lambda p: abs((p - hand).dot(L)))
        if (far - hand).dot(L) < 0: L = -L                                 # the end away from the hand to the right
    if kind in ('axe', 'greataxe'):                                         # the edge up: the side the head stands out to
        haft = bpy.data.objects[axis_part]; hc = sum(verts_world([haft]), Vector()) / len(haft.data.vertices)
        if (head - hc).dot(Wd) < 0: Wd = -Wd
    if kind == 'bow':                                                       # the belly of the bow up, the string below it
        sv = verts_world([bpy.data.objects['bowWood_string']]); scn = sum(sv, Vector()) / len(sv)
        if (C - scn).dot(Wd) < 0: Wd = -Wd
    T = L.cross(Wd).normalized()                                            # a right-handed frame: thickness toward the camera
    R = Matrix((L, T, Wd)).to_4x4()                                        # rows: world vectors to (x, y, z): length to X, breadth to Z
    S = Matrix.Diagonal((1.0, 1.0, broad, 1.0))
    for o in objs:
        mw = o.matrix_world.copy(); o.parent = None
        o.matrix_world = S @ R @ Matrix.Translation(-C) @ mw
        for c in o.users_collection: c.objects.unlink(o)
        gear.objects.link(o); o.hide_render = False
    vl.update()
    if kind == 'bow':                                                       # the stave's ten pieces as one (each drew its own edge, a string of beads)
        segs = [o for o in objs if o.name.startswith('bowWood_') and o.name[8:].isdigit()]
        with bpy.context.temp_override(active_object=segs[0], selected_editable_objects=segs, selected_objects=segs): bpy.ops.object.join()
        objs = [o for o in bpy.data.objects if o.type == 'MESH' and (o.name.startswith(kind + 'Wood') or o.name.startswith(kind + 'Metal'))]
    span0 = max(max(p.x for p in verts_world(objs)) - min(p.x for p in verts_world(objs)), 1e-3)
    for o in objs:                                                          # hafts, shafts, the rod and the stave at least 6 per cent of the length thick: at slot size a true haft was a dark hair
        if not (any(t in o.name for t in ('haft', 'shaft')) or o.name in ('rodWood_a',) or (kind == 'bow' and o.name.startswith('bowWood_') and 'string' not in o.name and 'nock' not in o.name and 'grip' not in o.name)): continue
        zs_ = [p.z for p in verts_world([o])]; ys_ = [p.y for p in verts_world([o])]
        t = min(max(zs_) - min(zs_), max(ys_) - min(ys_)) if kind != 'bow' else 0.03
        d = max(0.0, (0.06 * span0 - t) / 2)
        if d <= 0: continue
        mw = o.matrix_world; inv = mw.inverted(); nm = mw.inverted().transposed().to_3x3()
        o.data.calc_normals_split() if hasattr(o.data, 'calc_normals_split') else None
        for v in o.data.vertices:
            n = (nm @ v.normal).normalized(); n.x *= 0.15                   # mostly sideways: a haft gets no longer
            v.co = inv @ (mw @ v.co + n.normalized() * d)
    if kind == 'rod':
        P0 = verts_world(objs); tip = max(P0, key=lambda p: p.x); line_len = 0.42
        lm = bpy.data.meshes.new('rodWood_line'); bm_ = __import__('bmesh').new()
        __import__('bmesh').ops.create_cone(bm_, cap_ends=True, segments=6, radius1=0.014, radius2=0.014, depth=line_len, matrix=Matrix.Translation(tip + Vector((0, 0, -line_len / 2))))
        bm_.to_mesh(lm); bm_.free(); lo = bpy.data.objects.new('rodWood_line', lm); lm.materials.append(bpy.data.materials['item_cord']); gear.objects.link(lo)
        fl = bpy.data.meshes.new('rodWood_float'); bm_ = __import__('bmesh').new()
        __import__('bmesh').ops.create_uvsphere(bm_, u_segments=12, v_segments=8, radius=0.075, matrix=Matrix.Translation(tip + Vector((0, 0, -line_len))) @ Matrix.Diagonal((1, 1, 1.3, 1)))
        bm_.to_mesh(fl); bm_.free(); fo = bpy.data.objects.new('rodWood_float', fl)
        red = toon.material('icon_float', '#c0442e', None, 'cel'); fl.materials.append(red); gear.objects.link(fo)
        objs += [lo, fo]
    vl.update()
    P = verts_world(objs); xs = [p.x for p in P]; zs = [p.z for p in P]
    x0, x1, z0, z1 = min(xs), max(xs), min(zs), max(zs); span = max(x1 - x0, z1 - z0) * 1.07
    cam_d.ortho_scale = span; cam.location = ((x0 + x1) / 2, -20, (z0 + z1) / 2); cam_d.clip_end = 100
    for part in ('Wood', 'Metal'):                                          # the same framing for both: the game lays one over the other
        shown = [o for o in objs if (kind + part) in o.name]
        if not shown: continue
        for o in objs:
            for c in o.users_collection: c.objects.unlink(o)
            if part == 'Metal' and o not in shown: hold.objects.link(o); o.hide_render = False; o.is_holdout = True   # the metal cut where wood lies in front of it, no line drawn round the wood
            else: gear.objects.link(o); o.hide_render = o not in shown; o.is_holdout = False
        sc.render.filepath = os.path.join(OUT, kind + '_' + part.lower() + '.png'); bpy.ops.render.render(write_still=True)
    for o in objs: o.hide_render = True; o.is_holdout = False
    print('ICON', kind, 'span %.2f m' % span)
print('ICONS in', OUT)
