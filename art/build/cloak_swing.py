"""The hero's cloak that swings (2026-10-22; Robin: "do your numbers 1-4", the second being the hero's open items: the cloak hung
as one stiff panel bound to the chest, moving through the legs and never trailing). The back panel is rebuilt as a hanging cloth of
rows, skinned to a chain of three new bones under the chest (cloak1 at the shoulders, cloak2, cloak3 at the hem), and every clip
gets the chain keyed frame by frame:
  - it hangs down, its top following the chest's lean a little (it is pinned at the shoulders);
  - it trails behind by the clip's pace (a little standing, more walking, most running);
  - it bounces with each step and sways with the hips in the walks and the run, each lower bone a little later and further (a whip);
  - it lags behind every turn of the chest (each bone takes the chest's facing from a few frames before), so it flares in a blow.
Loops (the walks, the run, the idles) wrap, so the clip still loops.
  node tools/blender.js cloak_swing.py -- <hero_kit_gait.blend> <out.blend>"""
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
sc = bpy.context.scene; vl = bpy.context.view_layer
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
RW = rig.matrix_world; RWi = RW.inverted(); R3 = RW.to_3x3(); R3i = R3.inverted()
CH = 'mixamorig:Spine2'
cb = bpy.data.objects['cloak_back']
SHZ = max(v.co.z for v in cb.data.vertices)                       # the top of the panel (world z; the kit's meshes sit in world space)
JOINTS = [Vector((0, 0.13, SHZ - 0.06)), Vector((0, 0.2, 0.86)), Vector((0, 0.24, 0.56)), Vector((0, 0.26, 0.27))]   # shoulders, back, calf, hem

# ---- the bones: a chain under the chest, in the armature's own space
bpy.context.view_layer.objects.active = rig; rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones; parent = eb[CH]; names = []
for i in range(3):
    b = eb.new('cloak%d' % (i + 1)); b.head = RWi @ JOINTS[i]; b.tail = RWi @ JOINTS[i + 1]; b.parent = parent; b.use_connect = i > 0; b.use_deform = True
    b.roll = 0.0; parent = b; names.append(b.name)
bpy.ops.object.mode_set(mode='OBJECT')
for n in names: rig.pose.bones[n].rotation_mode = 'QUATERNION'

# ---- the panel: rows from the shoulders to the hem, a little wider at the hem, skinned down the chain
rings = sorted([[cb.matrix_world @ v.co for v in cb.data.vertices if abs(v.co.z - z) < 1e-4] for z in sorted({round(v.co.z, 4) for v in cb.data.vertices})], key=lambda r: -r[0].z)   # top first
def ring_at(z):                                                   # the panel's cross-section at height z, from the kit's three rings (each four corners)
    for a, b in zip(rings, rings[1:]):
        if b[0].z <= z <= a[0].z:
            t = (a[0].z - z) / max(1e-6, a[0].z - b[0].z); A = sorted(a, key=lambda p: (round(p.y, 3), p.x)); B = sorted(b, key=lambda p: (round(p.y, 3), p.x))
            return [A[k].lerp(B[k], t) for k in range(4)]
    return None
NR, NX = 14, 6
bm = bmesh.new(); grid = []
for r in range(NR + 1):
    z = rings[0][0].z - (rings[0][0].z - rings[-1][0].z) * r / NR; q = ring_at(z)   # q sorted: two front corners (small y), two back corners
    front = sorted(q[:2], key=lambda p: p.x); back = sorted(q[2:], key=lambda p: p.x)
    fl = 1.0 + 0.12 * (r / NR) ** 1.5                                # the hem a little wider: cloth falls open
    row = []
    for side in (front, back):
        for k in range(NX + 1):
            p = side[0].lerp(side[1], k / NX); p = Vector((p.x * fl, p.y, z)); row.append(bm.verts.new(p))
    grid.append(row)
for r in range(NR):
    a, b = grid[r], grid[r + 1]; n = NX + 1
    for s0 in (0, n):
        for k in range(NX): bm.faces.new((a[s0 + k], a[s0 + k + 1], b[s0 + k + 1], b[s0 + k]))
    bm.faces.new((a[0], a[n], b[n], b[0])); bm.faces.new((a[NX], b[NX], b[n + NX], a[n + NX]))   # the sides
bm.faces.new([grid[0][k] for k in range(NX + 1)] + [grid[0][n + NX - k] for k in range(NX + 1)])
bm.faces.new([grid[-1][n + k] for k in range(NX + 1)][::-1] + [grid[-1][NX - k] for k in range(NX + 1)][::-1])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = cb.data; bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
cb.matrix_world = Matrix.Identity(4) if cb.parent is None else cb.matrix_world   # (the panel's coordinates were built in world space)
cb.data.transform(cb.matrix_world.inverted()) if cb.parent is not None else None
for vg in list(cb.vertex_groups): cb.vertex_groups.remove(vg)
G = {n: cb.vertex_groups.new(name=n) for n in [CH] + names}
segz = [(JOINTS[i].z, JOINTS[i + 1].z) for i in range(3)]
for v in me.vertices:
    z = (cb.matrix_world @ v.co).z
    w = {CH: max(0.0, min(1.0, (z - (JOINTS[0].z - 0.12)) / 0.12))}     # the top held by the chest (pinned at the shoulders)
    rest = 1.0 - w[CH]
    mids = [(a + b) / 2 for a, b in segz]
    ws = [max(0.0, 1.0 - abs(z - m) / ((segz[i][0] - segz[i][1]) * 0.85)) for i, m in enumerate(mids)]
    if z < mids[-1]: ws[-1] = 1.0
    if z > mids[0]: ws[0] = max(ws[0], 1.0)
    s = sum(ws) or 1.0
    for i, n in enumerate(names): w[n] = rest * ws[i] / s
    for n, x in w.items():
        if x > 1e-4: G[n].add([v.index], x, 'REPLACE')

# ---- the motion
PACE = {'jog': (0.30, 0.09, 0.07), 'walk': (0.22, 0.06, 0.07), 'block_walk': (0.18, 0.05, 0.06), 'block_wpn_walk': (0.18, 0.05, 0.06), 'walk_fast': (0.28, 0.08, 0.08), 'run': (0.42, 0.12, 0.08)}
LOOPS = {'jog', 'walk', 'walk_fast', 'run', 'block_walk', 'block_wpn_walk', 'idle', 'idle_look', 'sit', 'block', 'block_wpn'}
STILL = 0.06; BLOW = 0.12
def chest_world(f):
    sc.frame_set(f); pb = rig.pose.bones[CH]; return (RW @ pb.matrix).to_3x3() @ (RW @ rig.data.bones[CH].matrix_local).to_3x3().inverted()
def horiz(v):
    v = Vector((v.x, v.y, 0)); return v.normalized() if v.length > 1e-6 else Vector((0, 1, 0))
ad = rig.animation_data
done = []
for act in bpy.data.actions:
    if act.name.endswith('_mixamo'): continue
    ad.action = act
    if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
    if act.name == 'death':                                       # falling, the cloak goes down with him as it lay on his back (hanging toward the ground it stuck out of the frame)
        for n in names: pb = rig.pose.bones[n]; pb.rotation_quaternion = (1, 0, 0, 0); pb.keyframe_insert('rotation_quaternion', frame=int(act.frame_range[0]), group='cloak')
        done.append(act.name); continue
    f0, f1 = int(act.frame_range[0]), int(act.frame_range[1]); N = f1 - f0 + 1; loop = act.name in LOOPS
    for n in names: rig.pose.bones[n].rotation_quaternion = (1, 0, 0, 0)
    Rd = {f: chest_world(f) for f in range(f0, f1 + 1)}
    def at(f):                                                    # a frame inside the clip: wrapped in a loop, held at the ends otherwise
        if loop: return f0 + ((f - f0) % (N - 1 if N > 1 else 1))
        return min(f1, max(f0, f))
    T, Bb, Bs = PACE.get(act.name, (STILL if loop else BLOW, 0.0, 0.0))
    if act.name in ('idle', 'idle_look', 'sit'): Bs = 0.025         # a breath of a sway standing
    for f in range(f0, f1 + 1):
        p = (f - f0) / max(1, (N - 1 if loop else N))
        for n in names: rig.pose.bones[n].rotation_quaternion = (1, 0, 0, 0)
        sc.frame_set(f); vl.update()
        for i, n in enumerate(names):
            pb = rig.pose.bones[n]; lag = 2 * (i + 1); ph = p - 0.07 * (i + 1); amp = 1.0 + 0.35 * i
            R = Rd[at(f - lag)]; back = horiz(R @ Vector((0, 1, 0))); side = horiz(R @ Vector((1, 0, 0)))
            down = Vector((0, 0, -1)).lerp((Rd[f] @ Vector((0, 0, -1))).normalized(), 0.35 if i == 0 else 0.12)
            b = T * (1 + 0.5 * i) + Bb * amp * math.sin(2 * 2 * math.pi * ph)
            s = Bs * amp * math.sin(2 * math.pi * ph)
            d = (down + back * b + side * s).normalized()                  # the world direction this bone should hang
            M = RW @ pb.matrix; head = M.translation; cur = M.to_3x3() @ Vector((0, 1, 0))
            rot = cur.normalized().rotation_difference(d)
            Mw = Matrix.Translation(head) @ (rot.to_matrix() @ M.to_3x3()).to_4x4()
            pb.matrix = RWi @ Mw; vl.update()
            pb.keyframe_insert('rotation_quaternion', frame=f, group='cloak')
    done.append(act.name)
print('CLOAK keyed', len(done), 'clips:', ' '.join(done))
bpy.ops.wm.save_as_mainfile(filepath=argv[1])
print('CLOAK saved', argv[1])
