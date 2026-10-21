"""The villagers' variety and their work (2026-10-20, the studio; the villages plan step 5B). Opens the game's people.blend (one body
for everyone, with layers) and adds, on the same conventions as people_build.py:

  Gear layers   apron       a linen apron over the tunic or the dress: a bib on the chest and a panel to the knee, near white so the
                            game colours it
                kerchief    a woman's head cloth: a cap round the hair, open at the face, knotted at the nape with two tails
                strawHat    a straw hat with a wide brim and a low crown, for the fields
  Hand things   hammerWood, hammerMetal   the smith's hammer      sawWood, sawMetal   a frame saw's blade and handle      bucketWood   a bucket hung from the hand
  Clips         hammer      12 frames, looped: the right arm raised and brought down on the work, the body bent a little over the bench
                saw         12 frames, looped: both arms forward at the hip, pushed and pulled, the body rocking with them
                carry       2 frames, held: the idle with the right arm down and a little forward, the bucket hung from it
                carry_walk  the walk's frames with the right arm held so
                kneel       8 frames to the kneel and held: the hips sink, the right knee to the ground, the left foot forward, the hands before the knee

The bones are aimed at directions in the world (kit_block.py's way): no axis is guessed. The hips are moved by a world delta
through the bone's matrix. Saves folk.blend beside the source.   node tools/blender.js folk_build.py -- <in people.blend> <out folk.blend>"""
import bpy, bmesh, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:]
IN, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene; rig = next(o for o in sc.objects if o.type == 'ARMATURE')
gear = bpy.data.collections['Gear']
TOP, HEAD = 1.62, 0.40; CHIN = TOP - HEAD; SH = CHIN - 0.08; HIP = 0.72; KNEE = 0.42; ANKLE = 0.10; SHW, HIPW = 0.22, 0.18; hz = CHIN + HEAD * 0.52
def mat(name, hexs=None): return bpy.data.materials.get(name) or toon.material(name, hexs, None, 'cel')
M = {'cloth': mat('p_tunic', '#efefef'), 'trim': mat('p_trim', '#c4c4c4'), 'straw': mat('p_straw', '#c9b05e'), 'strawd': mat('p_strawd', '#a88f44'), 'wood': mat('item_wood', '#8a5f3c'), 'metal': mat('item_metal', '#b4b8bf'), 'iron': mat('p_irondark', '#70777f')}
for o in list(gear.objects):                             # a second run builds them afresh
    if o.name.startswith(('apron', 'kerchief', 'strawHat', 'hammer', 'saw', 'bucket')): bpy.data.objects.remove(o)

# ---- meshes in the T-pose, each bound whole to one of Mixamo's bones (people_build.py's way) ----
def obj(name, bm, m, bone, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); gear.objects.link(o)
    o.vertex_groups.new(name='mixamorig:' + bone).add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    md = o.modifiers.new('Rig', 'ARMATURE'); md.object = rig
    o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted(); o.hide_render = True; return o
def cone(name, m, bone, p0, p1, r0, r1, seg=10, sx=1.0, sy=1.0, ends=True):
    bm = bmesh.new(); p0, p1 = Vector(p0), Vector(p1); q = (p1 - p0).normalized().to_track_quat('Z', 'Y'); rings = []
    for (p, r) in ((p0, r0), (p1, r1)):
        ring = []
        for i in range(seg): a = 2 * math.pi * (i + 0.5) / seg; v = Vector((math.cos(a) * r * sx, math.sin(a) * r * sy, 0)); v.rotate(q); ring.append(bm.verts.new(p + v))
        rings.append(ring)
    for i in range(seg): bm.faces.new((rings[0][i], rings[0][(i + 1) % seg], rings[1][(i + 1) % seg], rings[1][i]))
    if ends: bm.faces.new(rings[0][::-1]); bm.faces.new(rings[1])
    return obj(name, bm, m, bone)
def ball(name, m, bone, c, r, seg=12, rings=8, sx=1.0, sy=1.0, sz=1.0):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    return obj(name, bm, m, bone)
def cap(name, m, bone, c, r, plane_point, plane_normal, seg=14, rings=10, sx=1.0, sy=1.0, sz=1.0):
    """a sphere with the face cut away: what lies on the normal's side of the plane stays"""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz)) + Vector(c)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector(plane_point), plane_no=Vector(plane_normal).normalized(), clear_inner=True); return obj(name, bm, m, bone)
def box(name, m, bone, c, size):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts); return obj(name, bm, m, bone, False)
def panel(name, m, bone, pts, thick=0.012):
    """a flat cloth panel through four points, given a thickness so both sides render"""
    bm = bmesh.new(); vs = [bm.verts.new(Vector(p)) for p in pts]; bm.faces.new(vs); o = obj(name, bm, m, bone, False); so = o.modifiers.new('Solid', 'SOLIDIFY'); so.thickness = thick; so.offset = 0; return o

# the apron: a bib on the chest (Spine2) and a panel from the belt to the knee (Hips), hanging at the front of the tunic's skirt
FRONT = -0.125
panel('apron_bib', M['cloth'], 'Spine2', [(-0.08, FRONT - 0.008, HIP + 0.1), (0.08, FRONT - 0.008, HIP + 0.1), (0.07, FRONT - 0.004, SH - 0.06), (-0.07, FRONT - 0.004, SH - 0.06)])
panel('apron_skirt', M['cloth'], 'Hips', [(-0.17, -0.2, KNEE + 0.02), (0.17, -0.2, KNEE + 0.02), (0.13, FRONT - 0.03, HIP + 0.09), (-0.13, FRONT - 0.03, HIP + 0.09)])
box('apron_band', M['trim'], 'Hips', (0, FRONT - 0.035, HIP + 0.085), (0.28, 0.012, 0.025))
for sx in (-1, 1): box('apron_strap' + ('L' if sx > 0 else 'R'), M['trim'], 'Spine2', (sx * 0.06, -0.09, SH - 0.02), (0.02, 0.09, 0.09))
# the kerchief: a cloth round the head, open at the face, a knot at the nape and two tails
cap('kerchief_cap', M['cloth'], 'Head', c=(0, 0.012, hz + 0.018), r=HEAD * 0.5 + 0.012, plane_point=(0, -0.16, hz + 0.11), plane_normal=(0, 0.62, 1), sx=0.97, sy=1.05, sz=1.05)
ball('kerchief_knot', M['cloth'], 'Head', (0, 0.205, hz - 0.07), 0.04, 8, 6, 1.0, 0.8, 0.8)
for sx in (-1, 1): cone('kerchief_tail' + ('L' if sx > 0 else 'R'), M['cloth'], 'Head', (sx * 0.02, 0.21, hz - 0.09), (sx * 0.05, 0.22, hz - 0.24), 0.03, 0.012, 7, 1.0, 0.5)
# the straw hat: a wide brim and a low crown, a dark band
cone('strawHat_brim', M['straw'], 'Head', (0, 0.0, hz + 0.1), (0, -0.01, hz + 0.118), 0.36, 0.35, 16, 1.0, 1.0)
cone('strawHat_crown', M['strawd'], 'Head', (0, 0.0, hz + 0.11), (0, 0.0, hz + 0.26), 0.2, 0.165, 12, 1.0, 1.0)
cone('strawHat_band', M['iron'], 'Head', (0, 0.0, hz + 0.12), (0, 0.0, hz + 0.15), 0.205, 0.2, 12, 1.0, 1.0, ends=False)

# ---- the things for the hand (people_build.py's item(): on the right forearm at the grip, +Z out of the fist) ----
GRIP = Vector((0.0, 0.085, 0.0))
def item(name, bm, m, flat=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = not flat
    o = bpy.data.objects.new(name, me); gear.objects.link(o)
    o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = 'mixamorig:RightForeArm'; o.matrix_parent_inverse = Matrix.Identity(4); o.location = GRIP; o.rotation_euler = (-math.pi / 2, 0, 0); o.hide_render = True
    return o
def icyl(name, m, p0, p1, r0, r1, seg=8):
    bm = bmesh.new(); d = Vector(p1) - Vector(p0); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r1, depth=d.length)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(p0) + d / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4(), verts=bm.verts); return item(name, bm, m, False)
def ibox(name, m, c, size):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts); return item(name, bm, m)
icyl('hammerWood_haft', M['wood'], (0, 0, -0.06), (0, 0, 0.32), 0.016, 0.014); ibox('hammerMetal_head', M['metal'], (0, 0, 0.3), (0.05, 0.12, 0.05))
icyl('sawWood_handle', M['wood'], (0, 0, -0.04), (0, 0, 0.1), 0.016, 0.015); ibox('sawMetal_blade', M['metal'], (0, -0.045, 0.36), (0.004, 0.09, 0.56)); ibox('sawWood_back', M['wood'], (0, -0.1, 0.36), (0.014, 0.02, 0.56))
icyl('bucketWood_pail', M['wood'], (0, 0, -0.42), (0, 0, -0.16), 0.1, 0.12, 10); icyl('bucketWood_handle', M['iron'], (0, 0.12, -0.17), (0, -0.12, -0.17), 0.006, 0.006, 6)

# ---- the clips: the idle's first pose as the base, bones aimed in the world, every bone keyed each frame ----
def set_action(act):
    ad = rig.animation_data or rig.animation_data_create(); ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    return act
def aim(bn, d):
    pb = rig.pose.bones['mixamorig:' + bn]; Mw = rig.matrix_world @ pb.matrix; loc = Mw.to_translation(); Rm = Mw.to_3x3().normalized(); d = Vector(d).normalized()
    cur = (Rm @ Vector((0, 1, 0))).normalized(); R2 = cur.rotation_difference(d).to_matrix() @ Rm
    M2 = R2.to_4x4(); M2.translation = loc; pb.matrix = rig.matrix_world.inverted() @ M2; bpy.context.view_layer.update()
def drop_hips(dz):
    pb = rig.pose.bones['mixamorig:Hips']; Mw = rig.matrix_world @ pb.matrix; Mw.translation = Mw.translation + Vector((0, 0, -dz)); pb.matrix = rig.matrix_world.inverted() @ Mw; bpy.context.view_layer.update()
def key_all(f):
    for pb in rig.pose.bones: pb.keyframe_insert('location', frame=f); pb.keyframe_insert('rotation_quaternion' if pb.rotation_mode == 'QUATERNION' else 'rotation_euler', frame=f)
def lerp3(a, b, k): return Vector(a).lerp(Vector(b), k)
def ease(k): return k * k * (3 - 2 * k)
idle = bpy.data.actions['idle']; set_action(idle); sc.frame_set(int(idle.frame_range[0])); bpy.context.view_layer.update()
BASE = {pb.name: (pb.rotation_quaternion.copy(), pb.rotation_euler.copy(), pb.location.copy()) for pb in rig.pose.bones}
def to_base():
    for pb in rig.pose.bones: q, e, l = BASE[pb.name]; pb.rotation_quaternion = q; pb.rotation_euler = e; pb.location = l
    bpy.context.view_layer.update()
def cur_dir(bn): pb = rig.pose.bones['mixamorig:' + bn]; return ((rig.matrix_world @ pb.matrix).to_3x3().normalized() @ Vector((0, 1, 0))).normalized()
def new_action(name, n):
    if name in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions[name])
    act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = n; set_action(act); return act
def arms(RA, RF, LA=None, LF=None):
    aim('RightArm', RA); aim('RightForeArm', RF)
    if LA: aim('LeftArm', LA); aim('LeftForeArm', LF)

# the hammer: up over four frames, down in two (the blow lands on frame 6), the arm recovers; the body bent a little over the bench, the left hand holding the work
UP_A, UP_F = (0.25, -0.1, 0.96), (0.1, -0.55, 0.83); DN_A, DN_F = (0.12, -0.5, -0.86), (0.0, -0.9, -0.44); HOLD_A, HOLD_F = (-0.35, -0.7, -0.62), (0.1, -0.95, 0.25)   # up: the upper arm raised past the ear, the forearm back; down: the arm down and forward, the forearm onto the bench
act = new_action('hammer', 12); act['contact'] = 6
for f in range(1, 13):
    p = (f - 1) / 12
    if f <= 4: k = ease((f - 1) / 3)                         # the raise
    elif f <= 6: k = 1 - ease((f - 4) / 2)                   # the blow
    else: k = 0.0 if f <= 8 else ease((f - 8) / 4) * 0.0     # the rest at the bottom, then up again at frame 1
    to_base(); aim('Spine2', (0, -0.14, 0.99)); arms(lerp3(DN_A, UP_A, k), lerp3(DN_F, UP_F, k), HOLD_A, HOLD_F); key_all(f)
# the saw: both arms forward at hip height; the forearms reach and fold, the body rocks with them
act = new_action('saw', 12)
for f in range(1, 13):
    w = 2 * math.pi * (f - 1) / 12; k = 0.5 + 0.5 * math.sin(w)                                    # k 1: the push (arms long), 0: the pull (arms folded)
    to_base(); aim('Spine2', (0, -0.08 - 0.12 * k, 0.99)); arms(lerp3((0.2, -0.55, -0.81), (0.2, -0.75, -0.64), k), lerp3((0.0, -0.55, 0.83), (0.0, -0.97, 0.22), k), lerp3((-0.2, -0.55, -0.81), (-0.2, -0.75, -0.64), k), lerp3((0.0, -0.55, 0.83), (0.0, -0.97, 0.22), k)); key_all(f)
# the carry: the right arm straight down and a little forward, the bucket hanging; held
act = new_action('carry', 2)
for f in (1, 2): to_base(); aim('Spine2', (0.03, -0.02, 0.99)); arms((0.12, -0.2, -0.97), (0.06, -0.25, -0.97)); key_all(f)
# the carry walk: the walk's own frames with the right arm held so
walk = bpy.data.actions['walk']; cw = walk.copy(); cw.name = 'carry_walk'; cw.use_fake_user = True; set_action(cw); w0, w1 = int(round(walk.frame_range[0])), int(round(walk.frame_range[1]))
for f in range(w0, w1 + 1):
    sc.frame_set(f); bpy.context.view_layer.update(); aim('RightArm', (0.12, -0.2, -0.97)); aim('RightForeArm', (0.06, -0.25, -0.97))
    for bn in ('RightArm', 'RightForeArm'): rig.pose.bones['mixamorig:' + bn].keyframe_insert('rotation_quaternion', frame=f)
# the kneel: the hips sink, the right knee to the ground with the shin back along it, the left foot forward, the hands before the knee; held from frame 8
act = new_action('kneel', 8)
for f in range(1, 9):
    k = ease(min(1.0, (f - 1) / 6)); to_base(); drop_hips(0.40 * k); aim('Spine2', lerp3((0, 0, 1), (0, -0.14, 0.99), k))
    aim('RightUpLeg', lerp3(cur_dir('RightUpLeg'), (0, 0.1, -0.99), k)); aim('RightLeg', lerp3(cur_dir('RightLeg'), (0, 0.96, -0.28), k))
    aim('LeftUpLeg', lerp3(cur_dir('LeftUpLeg'), (0, -0.6, -0.8), k)); aim('LeftLeg', lerp3(cur_dir('LeftLeg'), (0, -0.1, -0.99), k))
    arms(lerp3(cur_dir('RightArm'), (0.2, -0.6, -0.77), k), lerp3(cur_dir('RightForeArm'), (0.0, -0.95, -0.3), k), lerp3(cur_dir('LeftArm'), (-0.2, -0.6, -0.77), k), lerp3(cur_dir('LeftForeArm'), (0.0, -0.95, -0.3), k)); key_all(f)
# sit_work (the developer's ask, 2026-10-20): the sit's own frames with the hands busy in the lap, for the weaver, the net mender, the quern
sit = bpy.data.actions['sit']; sw = sit.copy(); sw.name = 'sit_work'; sw.use_fake_user = True; set_action(sw); s0, s1 = int(round(sit.frame_range[0])), int(round(sit.frame_range[1]))
for f in range(s0, s1 + 1):
    sc.frame_set(f); bpy.context.view_layer.update(); w = 2 * math.pi * (f - s0) / 24; k = 0.5 + 0.5 * math.sin(w)
    aim('RightArm', (0.25, -0.45, -0.86)); aim('RightForeArm', lerp3((0.1, -0.9, 0.42), (-0.3, -0.85, 0.44), k)); aim('LeftArm', (-0.25, -0.45, -0.86)); aim('LeftForeArm', lerp3((-0.1, -0.9, 0.42), (0.3, -0.85, 0.44), 1 - k)); aim('Spine2', (0, -0.12, 0.99))
    for bn in ('RightArm', 'RightForeArm', 'LeftArm', 'LeftForeArm', 'Spine2'): rig.pose.bones['mixamorig:' + bn].keyframe_insert('rotation_quaternion', frame=f)
set_action(idle); sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('FOLK', os.path.basename(OUT), 'gear', sorted(set(o.name.split('_')[0] for o in gear.objects if o.name.startswith(('apron', 'kerchief', 'strawHat', 'hammer', 'saw', 'bucket')))), 'clips', [a.name for a in bpy.data.actions if a.name in ('hammer', 'saw', 'carry', 'carry_walk', 'kneel')])
