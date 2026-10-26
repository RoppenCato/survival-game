"""The people (2026-10-12, docs/archive/battle-plan.md rung 0; Robin: Blender the hirdmen and other humans; one body, with layers).

One body for everyone, made from the hero's (art/source/hero2_mixamo.blend: his parts on Mixamo's skeleton, his eighteen
clips, the things for the hand), so a villager, a guard and a hirdman are the same sheets:

  Body        what is never changed and never coloured: the head with its painted face, the neck, the hands, the boots, the belt
  PartTunic   the tunic, in a near white the game colours when it draws (render.py: a 'Part...' collection is a layer of the
  PartLegs    the trousers, the same                             body itself, rendered with the rest of the body as a holdout)
  Gear        what a person may or may not have, each a layer over the body: hairA (tied back), hairB (long), hairC (a
              knot), beardA (short), beardB (long), hood, cap, helm, mail, cloak, dress, shieldFace (coloured) and shieldRim,
              and the things for the hand the hero already has, with a Dane axe (greataxe) added

Cloth, hair and the shield's face are near white so that a colour multiplied over them gives that colour with the render's
own light and line in it. Leather, iron and skin are what they are.

One clip is made here, because Mixamo's are for empty hands: 'block', the left arm bringing the shield across the body from
the idle's stance. The bones are aimed at directions in the world (pb.matrix), so no axis is guessed.

Saves art/source/people.blend.   node tools/blender.js art/build/people_build.py"""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(os.path.join(SRC, 'hero2_mixamo.blend')))
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
body = bpy.data.collections['Body']; gear = bpy.data.collections['Gear']
toon.face_images('folk')                                 # 2026-10-20 (the studio): the people's face, painted over the hero's in place (no moustache)

# the hero's own measures (hero2_build.py): the parts lie in the T-pose, facing -Y, the left side at +X
TOP, HEAD = 1.62, 0.40
CHIN = TOP - HEAD; SH = CHIN - 0.08; HIP = 0.72; KNEE = 0.42; ANKLE = 0.10
SHW, HIPW = 0.22, 0.18; ARM1, ARM2 = 0.26, 0.24
hz = CHIN + HEAD * 0.52

WHITE = '#efefef'; SHADE = '#c4c4c4'                    # cloth to be coloured, and its darker bands (hem, cuffs, neck)
COL = {'p_tunic': WHITE, 'p_trim': SHADE, 'p_legs': WHITE, 'p_hair': WHITE, 'p_cloak': WHITE, 'p_dress': WHITE, 'p_dresstrim': SHADE, 'p_hood': WHITE, 'p_shield': WHITE,
       'p_iron': '#9aa1ab', 'p_irondark': '#70777f', 'p_mail': '#8d949c', 'p_leather': '#6a4a32', 'p_wood': '#8a5f3c', 'p_boss': '#aab0b8'}
M = {k: toon.material(k, v, None, 'cel') for k, v in COL.items()}

# ---- the hero's own things go; his tunic and trousers become layers ----
for o in list(body.objects):
    if o.name in ('cowl', 'hoodback', 'hair', 'braidtie', 'beard', 'pouchL', 'pouchR') or o.name.startswith(('braid', 'fringe', 'tuft')): bpy.data.objects.remove(o)   # 2026-10-20 (the studio): the hero's fringe and beard tufts (2026-10-13) are his, not theirs
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in [k.name for k in sc.collection.children]: sc.collection.children.link(c)
    return c
tunic_c = coll('PartTunic'); legs_c = coll('PartLegs')
def move(o, c, mat):
    for k in list(o.users_collection): k.objects.unlink(o)
    c.objects.link(o); o.data.materials.clear(); o.data.materials.append(mat)
for o in list(body.objects):
    n = o.name
    if n in ('chest', 'skirt') or n.startswith(('shoulder.', 'upper_arm.', 'forearm.')): move(o, tunic_c, M['p_tunic'])
    elif n in ('hem', 'neckband') or n.startswith('cuff.'): move(o, tunic_c, M['p_trim'])
    elif n.startswith(('thigh.', 'shin.')): move(o, legs_c, M['p_legs'])

# ---- meshes in the T-pose, each bound whole to one of Mixamo's bones ----
def obj(name, bm, mat, bone, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); gear.objects.link(o)
    vg = o.vertex_groups.new(name='mixamorig:' + bone); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    md = o.modifiers.new('Rig', 'ARMATURE'); md.object = rig
    o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
    o.hide_render = True
    return o
def cone(name, mat, bone, p0, p1, r0, r1, seg=10, sx=1.0, sy=1.0, smooth=True, ends=True):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * (i + 0.5) / seg; v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    if ends: bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return obj(name, bm, mat, bone, smooth)
def ball(name, mat, bone, c, r, seg=12, rings=8, sx=1.0, sy=1.0, sz=1.0):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    return obj(name, bm, mat, bone)
def cap(name, mat, bone, c, r, plane_point, plane_normal, seg=14, rings=10, sx=1.0, sy=1.0, sz=1.0, cuts=()):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    for (pp, pn) in ((plane_point, plane_normal),) + tuple(cuts):
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector(pp), plane_no=Vector(pn).normalized(), clear_inner=True)
    return obj(name, bm, mat, bone)
def box(name, mat, bone, c, size):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(c)
    return obj(name, bm, mat, bone, False)
def wedge(name, mat, bone, rings_pts):
    bm = bmesh.new(); rings = [[bm.verts.new(Vector(p)) for p in ring] for ring in rings_pts]; n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    return obj(name, bm, mat, bone, False)
def disc(name, mat, bone, c, r, z0, z1, seg=18):
    return cone(name, mat, bone, (c[0], c[1], z0), (c[0], c[1], z1), r, r, seg, smooth=False)

for o in list(gear.objects):                             # a second run builds them afresh
    if o.name.startswith(('hair', 'beard', 'hood', 'cap', 'helm', 'mail', 'cloak', 'dress', 'shield', 'greataxe')): bpy.data.objects.remove(o)

HAIRCAP = dict(c=(0, 0.01, hz + 0.02), r=HEAD * 0.5, plane_point=(0, -0.17, hz + 0.125), plane_normal=(0, 0.6, 1), sx=0.95, sy=1.04, sz=1.04)
# hairA: the hero's cap of hair, tied back in a tail at the nape
cap('hairA_cap', M['p_hair'], 'Head', **HAIRCAP)
for i in range(3): ball('hairA_tail%d' % i, M['p_hair'], 'Head', (0, 0.19 + 0.012 * i, hz - 0.06 - 0.085 * i), 0.055 - 0.008 * i, 8, 6, 1.0, 0.85, 1.1)
# hairB: long and loose: the cap, a fall of hair down the back to the shoulders, a lock before each ear
cap('hairB_cap', M['p_hair'], 'Head', **HAIRCAP)
cone('hairB_fall', M['p_hair'], 'Head', (0, 0.115, hz + 0.02), (0, 0.15, SH - 0.13), 0.165, 0.2, 10, 1.0, 0.5)
for sx in (-1, 1):
    for i in range(4): ball('hairB_lock%d%s' % (i, 'L' if sx > 0 else 'R'), M['p_hair'], 'Head', (sx * (0.178 - 0.006 * i), 0.03 - 0.012 * i, hz - 0.075 - 0.078 * i), 0.044 - 0.005 * i, 8, 6, 0.85, 0.9, 1.15)
# hairC: cropped close, with a knot on the crown
cap('hairC_cap', M['p_hair'], 'Head', c=(0, 0.012, hz + 0.022), r=HEAD * 0.5, plane_point=(0, -0.15, hz + 0.15), plane_normal=(0, 0.45, 1), sx=0.94, sy=1.03, sz=1.03)
ball('hairC_knot', M['p_hair'], 'Head', (0, 0.07, hz + 0.225), 0.062, 8, 6, 1.0, 1.0, 0.9)
# beards (2026-10-12, redone: the first were a wedge that sat inside the head and read as a beak): a shell round the jaw
# from ear to ear, its upper edge under the mouth and rising toward the ears, with the chin's own bulk; the long one hangs
# to the chest and is tied
JAW = dict(c=(0, -0.012, hz - 0.012), r=HEAD * 0.5, plane_point=(0, -0.19, hz - 0.062), plane_normal=(0, 0.3, -1), sx=0.955, sy=1.03, sz=1.07, cuts=(((0, 0.035, 0), (0, -1, 0)),))
cap('beardA_jaw', M['p_hair'], 'Head', **JAW)
ball('beardA_chin', M['p_hair'], 'Head', (0, -0.118, CHIN + 0.012), 0.082, 10, 7, 1.15, 0.85, 0.8)
cap('beardB_jaw', M['p_hair'], 'Head', **JAW)
cone('beardB_fall', M['p_hair'], 'Head', (0, -0.13, CHIN - 0.19), (0, -0.115, CHIN + 0.035), 0.036, 0.096, 10, 1.0, 0.62)
ball('beardB_tie', M['p_trim'], 'Head', (0, -0.132, CHIN - 0.2), 0.032, 8, 6)
# the hood, up: round the head with the face free, and its cloth round the shoulders
cap('hood_up', M['p_hood'], 'Head', c=(0, 0.02, hz + 0.01), r=0.238, plane_point=(0, -0.115, hz), plane_normal=(0, 1, 0.12), sx=0.98, sy=1.05, sz=1.06, cuts=(((0, 0, CHIN - 0.02), (0, 0, 1)),))
cone('hood_cowl', M['p_hood'], 'Spine2', (0, 0.03, SH - 0.06), (0, 0.03, SH + 0.06), SHW * 0.95, SHW * 0.66, 10, 1.0, 0.82)
# a leather cap
cap('cap_bowl', M['p_leather'], 'Head', c=(0, 0.01, hz + 0.02), r=0.214, plane_point=(0, 0, hz + 0.045), plane_normal=(0, 0.28, 1), sx=0.96, sy=1.04, sz=1.02)
# the helmet: an iron bowl with a brim, a bar down the nose, a knob
cap('helm_bowl', M['p_iron'], 'Head', c=(0, 0.01, hz + 0.02), r=0.222, plane_point=(0, 0, hz + 0.035), plane_normal=(0, 0.22, 1), sx=0.97, sy=1.05, sz=1.04)
cone('helm_brim', M['p_irondark'], 'Head', (0, 0.012, hz + 0.02), (0, 0.004, hz + 0.058), 0.224, 0.222, 14, 0.97, 1.05, ends=False)
box('helm_nasal', M['p_irondark'], 'Head', (0, -0.212, hz - 0.035), (0.034, 0.022, 0.15))
ball('helm_knob', M['p_irondark'], 'Head', (0, 0.01, hz + 0.25), 0.03, 8, 6)
# mail: a shirt of rings over the tunic, to the hip, with short sleeves
cone('mail_chest', M['p_mail'], 'Spine2', (0, 0, HIP + 0.1), (0, 0, SH + 0.025), HIPW * 1.25 + 0.014, SHW * 1.0 + 0.014, 10, 1.0, 0.68)
cone('mail_skirt', M['p_mail'], 'Hips', (0, 0, HIP - 0.07), (0, 0, HIP + 0.1), HIPW * 1.42 + 0.012, HIPW * 1.25 + 0.014, 10, 1.0, 0.74)
for s, sx, bn in (('L', 1, 'LeftArm'), ('R', -1, 'RightArm')):
    a0 = Vector((sx * SHW, 0, SH - 0.04)); a1 = Vector((sx * (SHW + ARM1 * 0.62), 0, SH - 0.04))
    ball('mail_sh' + s, M['p_mail'], bn, a0 + Vector((sx * 0.02, 0, 0.02)), 0.096, 10, 7)
    cone('mail_sl' + s, M['p_mail'], bn, a0 + Vector((sx * 0.03, 0, 0)), a1, 0.089, 0.083, 10)
# the cloak: over the shoulders and down the back to the calf
cone('cloak_wrap', M['p_cloak'], 'Spine2', (0, 0.03, SH - 0.07), (0, 0.03, SH + 0.05), SHW * 1.0, SHW * 0.7, 10, 1.0, 0.84)
wedge('cloak_back', M['p_cloak'], 'Spine2', [
    [(-0.28, 0.2, 0.3), (0.28, 0.2, 0.3), (0.26, 0.27, 0.3), (-0.26, 0.27, 0.3)],                 # (clear of the tunic's skirt, which stands 0.19 back at the hip)
    [(-0.26, 0.2, HIP + 0.05), (0.26, 0.2, HIP + 0.05), (0.25, 0.27, HIP + 0.05), (-0.25, 0.27, HIP + 0.05)],
    [(-0.215, 0.05, SH - 0.02), (0.215, 0.05, SH - 0.02), (0.2, 0.17, SH - 0.02), (-0.2, 0.17, SH - 0.02)]])
# the apron dress: sleeveless over the tunic, a long skirt to the ankle, two straps
cone('dress_bodice', M['p_dress'], 'Spine2', (0, 0, HIP + 0.1), (0, 0, SH - 0.1), HIPW * 1.25 + 0.016, SHW * 1.02 + 0.012, 10, 1.0, 0.68)
cone('dress_skirt', M['p_dress'], 'Hips', (0, 0, ANKLE + 0.07), (0, 0, HIP + 0.1), HIPW * 1.78, HIPW * 1.25 + 0.016, 12, 1.0, 0.78)
cone('dress_hem', M['p_dresstrim'], 'Hips', (0, 0, ANKLE + 0.05), (0, 0, ANKLE + 0.12), HIPW * 1.8, HIPW * 1.76, 12, 1.0, 0.78)
for sx in (-1, 1): box('dress_strap' + ('L' if sx > 0 else 'R'), M['p_dresstrim'], 'Spine2', (sx * 0.11, -0.005, SH - 0.05), (0.05, SHW * 1.46, 0.11))
# the round shield on the left forearm: its back and rim of wood, an iron boss, and the face that takes the paint
fa0 = rig.matrix_world @ rig.data.bones['mixamorig:LeftForeArm'].head_local; fa1 = rig.matrix_world @ rig.data.bones['mixamorig:LeftForeArm'].tail_local
scx, scy, scz = (fa0.x + fa1.x) / 2 + 0.02, 0.0, fa0.z
disc('shieldRim_back', M['p_wood'], 'LeftForeArm', (scx, scy), 0.315, scz + 0.068, scz + 0.092)
ball('shieldRim_boss', M['p_boss'], 'LeftForeArm', (scx, scy, scz + 0.1), 0.062, 10, 6, 1.0, 1.0, 0.7)
disc('shieldFace_d', M['p_shield'], 'LeftForeArm', (scx, scy), 0.288, scz + 0.09, scz + 0.104)
for o in gear.objects:
    if o.name.startswith('shieldRim'): o['under'] = 'shieldFace'       # render.py: the face is a holdout under the rim's layer, and the rim under the face's
    if o.name.startswith('shieldFace'): o['under'] = 'shieldRim'

# ---- a Dane axe for the hand (the hero's things are in the file already; this follows items_build.py) ----
IM = {k: bpy.data.materials.get('item_' + k) or toon.material('item_' + k, v, None, 'cel') for k, v in {'wood': '#8a5f3c', 'metal': '#b4b8bf'}.items()}
GRIP = Vector((0.0, 0.085, 0.0))
def item(name, bm, mat, flat=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    for p in me.polygons: p.use_smooth = not flat
    o = bpy.data.objects.new(name, me); gear.objects.link(o)
    o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = 'mixamorig:RightForeArm'; o.matrix_parent_inverse = Matrix.Identity(4); o.location = GRIP; o.rotation_euler = (-math.pi / 2, 0, 0); o.hide_render = True
    return o
def icyl(name, mat, p0, p1, r0, r1, seg=8):
    bm = bmesh.new(); d = Vector(p1) - Vector(p0)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r1, depth=d.length)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(p0) + d / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4(), verts=bm.verts)
    return item(name, bm, mat, False)
def ibox(name, mat, c, size):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts); return item(name, bm, mat)
def iblade(name, mat, z0, z1, w0, w1, t, y=0.0):
    bm = bmesh.new()
    v = [bm.verts.new((sx * t / 2, y + sy * w0 / 2, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))] + [bm.verts.new((sx * t / 2, y + sy * w1 / 2, z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for a, b, c, d in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new((v[a], v[b], v[c], v[d]))
    return item(name, bm, mat)
icyl('greataxeWood_haft', IM['wood'], (0, 0, -0.34), (0, 0, 0.86), 0.018, 0.016)
ibox('greataxeMetal_head', IM['metal'], (0, -0.1, 0.78), (0.03, 0.22, 0.13))
iblade('greataxeMetal_edge', IM['metal'], 0.66, 0.9, 0.14, 0.26, 0.014, -0.25)

# ---- the one clip made here: the shield brought across (block) ----
def set_action(name):
    act = bpy.data.actions[name]; ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
if 'block' in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions['block'])
set_action('idle'); sc.frame_set(1); bpy.context.view_layer.update()
BASE = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.rotation_mode) for pb in rig.pose.bones}
act = bpy.data.actions.new('block'); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = 30
ad = rig.animation_data; ad.action = act
def key_all(frame):
    for pb in rig.pose.bones:
        pb.keyframe_insert('location', frame=frame)
        pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=frame)
def to_base():
    for pb in rig.pose.bones:
        loc, q, e, mode = BASE[pb.name]; pb.location = loc
        if mode == 'QUATERNION': pb.rotation_quaternion = q
        else: pb.rotation_euler = e
    bpy.context.view_layer.update()
def aim(bn, d, up_local=None, up_world=None):
    """Turn a bone so that it points along d (in the world); with up_local and up_world, also about itself so that its own
    up_local looks as nearly toward up_world as it can."""
    pb = rig.pose.bones[bn]; Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation(); R = Mw.to_3x3().normalized(); d = Vector(d).normalized()
    cur = (R @ Vector((0, 1, 0))).normalized(); R2 = cur.rotation_difference(d).to_matrix() @ R
    if up_local is not None:
        a = R2 @ Vector(up_local); a = (a - a.dot(d) * d).normalized(); b = Vector(up_world); b = (b - b.dot(d) * d).normalized()
        ang = a.angle(b); sign = 1.0 if d.dot(a.cross(b)) > 0 else -1.0; R2 = Matrix.Rotation(sign * ang, 3, d) @ R2
    M2 = R2.to_4x4(); M2.translation = loc; pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
fb = rig.data.bones['mixamorig:LeftForeArm']
DORSAL = (rig.matrix_world @ fb.matrix_local).to_3x3().normalized().inverted() @ Vector((0, 0, 1))      # the back of the forearm, where the shield lies: up, in the T-pose
def block_pose(k):                                       # k: 0 the idle's stance .. 1 the shield across
    to_base()
    if k <= 0: return
    pb = rig.pose.bones['mixamorig:LeftArm']; cur = ((rig.matrix_world @ pb.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
    aim('mixamorig:LeftArm', cur.lerp(Vector((-0.12, -0.62, -0.78)).normalized(), k))
    pf = rig.pose.bones['mixamorig:LeftForeArm']; curf = ((rig.matrix_world @ pf.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
    aim('mixamorig:LeftForeArm', curf.lerp(Vector((-0.8, -0.32, 0.5)).normalized(), k), DORSAL, Vector((0.12, -1.0, 0.22)))
    sp = rig.pose.bones.get('mixamorig:Spine1')
    if sp and sp.rotation_mode == 'QUATERNION': pass
for f, k in ((1, 0.0), (5, 0.7), (9, 1.0), (30, 1.0)):
    block_pose(k); key_all(f)
if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]

set_action('idle'); sc.frame_set(1)
out = os.path.abspath(os.path.join(SRC, 'people.blend')); bpy.ops.wm.save_as_mainfile(filepath=out)
print('people: body', sorted(o.name for o in body.objects))
print('people: tunic', len(tunic_c.objects), 'legs', len(legs_c.objects), 'gear layers', sorted(set(o.name.split('_')[0] for o in gear.objects)))
print('saved', out)
