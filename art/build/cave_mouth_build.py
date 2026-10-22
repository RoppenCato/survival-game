"""The troll's cave entrance, remade (2026-10-22; Robin: "I think the cave looks pretty bad overall. Shouldnt it be like a 3D feeling and that
you go inside a bit, like a cave. Also those stones tapered around the entrance dont look natural"). A real opening cut into a face of natural
rock: an overhanging brow with moss and hanging growth on it, the passage going in and bending away to the right, its floor running from
sunlit earth at the threshold into the dark, the walls and roof darkening with depth; a few boulders of different sizes lying where they fell,
not a ring of stones. Chosen tones; the line only where colours meet and where the brow passes before the dark; no outer contour, and the
outer edge of the rock face feathered by the packer, so the piece melts into the cliff the game paints round it.
Rendered from the set pieces' camera (35 degrees above the ground, looking north; 4 px a game unit when packed, twice that here).
  node tools/blender.js cave_mouth_build.py -- <out dir> [variant]
Writes caveMouth.png and meta.json (the origin: the middle of the threshold on the ground; the pixels a metre)."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'
from mathutils import Vector, Matrix, noise
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2
RNG = random.Random(17); U = lambda a, b: a + (b - a) * RNG.random(); TAU = 2 * math.pi; rad = math.radians
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll)

# ---- materials: the painted cliff's own rock (sampled from the game: #515c64 to #66737c), earth, moss; the inside darkening with depth
C = {}
def leaf(k, v):
    lit, shade = toon.chosen_tones(v, lit_dl=0.09, shade_dl=0.075, cool_k=0.2); C[k] = toon.material('c_' + k, v, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
C['rock'] = toon.material('c_rock', '#616d76', None, 'cel', lit='#717f89', shade='#4b5660', t_dark=0.45, t_lit=0.98)   # the game's wall: #4d575f to #73828c, the middle #5a666e
C['rock2'] = toon.material('c_rock2', '#525d66', None, 'cel', t_dark=0.6, t_lit=0.95)
C['earth'] = toon.material('c_earth', '#7a5c48', None, 'cel', t_dark=0.6, t_lit=0.95)
C['stone'] = toon.material('c_stone', '#6a747a', None, 'cel', t_dark=0.6, t_lit=0.95)
C['rock_in'] = toon.material('c_rock_in', '#5b6770', None, 'cel', t_dark=0.6, t_lit=0.95)   # the passage's walls and roof (the same rock; kept apart for the front layer)
leaf('moss', '#5f8a3e'); leaf('grass', '#7d8a4e'); leaf('hang', '#4f6e3a'); C['turf'] = toon.material('c_turf', '#7f875a', None, 'cel', lit='#848b5d', shade='#6f7850', t_dark=0.5, t_lit=1.0)   # grass and turf: the game's own ground by the cliff (#7d894c; the plateau #929767)
C['root'] = toon.material('c_root', '#5e4636', None, 'cel')
C['bone'] = toon.material('c_bone', '#d8cdb2', None, 'cel')
def deepen(m, y0=0.1, y1=3.4, dark=(0.009, 0.010, 0.016), most=0.96):
    """the colour drawn toward black with depth into the rock (world y): the cave's inside goes dark"""
    nt = m.node_tree; em = next(n for n in nt.nodes if n.type == 'EMISSION'); link = em.inputs['Color'].links[0]; src = link.from_socket; nt.links.remove(link)
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'; mr.inputs['From Min'].default_value = y0; mr.inputs['From Max'].default_value = y1
    mr.inputs['To Min'].default_value = 0.0; mr.inputs['To Max'].default_value = most; nt.links.new(sep.outputs['Y'], mr.inputs['Value'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; nt.links.new(mr.outputs['Result'], mix.inputs['Factor']); nt.links.new(src, mix.inputs[6]); mix.inputs[7].default_value = (*dark, 1)
    nt.links.new(mix.outputs[2], em.inputs['Color'])

def obj(name, bm, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def remesh(o, voxel, smooth_it=1, factor=0.5):
    rm = o.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = voxel
    if smooth_it: sm = o.modifiers.new('sm', 'SMOOTH'); sm.factor = factor; sm.iterations = smooth_it
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
def decimate(o, ratio):
    md = o.modifiers.new('dc', 'DECIMATE'); md.ratio = ratio; bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
    for p in o.data.polygons: p.use_smooth = False

# ---- the rock face: a thick slab of rock whose front swells gently (big forms only: small lumps break the light into camouflage), with a heavy
# lip of rock standing out over the opening; its sides ragged (and feathered by the packer), its top under the cliff's rim
W, TOP, DEEP = 4.3, 4.75, 7.0                                           # TOP: the game's wall, one level (HF = 84 units on screen) seen at 35 degrees
MH, MW = 3.6, 4.3                                                        # the opening at the face: the troll's door (Trollmor is 2.7 m), as the painted one was (4.1 by 3.6)
def smooth01(a, b, x): t = min(1.0, max(0.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def brow(z, e=0.0):                                                      # how far the brow stands out at height z: a rounded brow whose top meets the game's rim (2026-10-22, the developer: the turf run out over a lip read as a lighter strip)
    return smooth01(MH - 0.5 + e, MH + 0.35 + e, z) - 0.88 * smooth01(MH + 0.4, TOP, z)
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
bmesh.ops.transform(bm, matrix=Matrix.Translation((0, DEEP / 2 - 0.2, TOP / 2)) @ Matrix.Diagonal((W * 2, DEEP, TOP, 1.0)), verts=bm.verts)
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=26, use_grid_fill=True)
for v in bm.verts:
    p = v.co
    if p.y < 0.2:
        xb = p.x + 0.22 * p.z + 0.5 * noise.noise(Vector((p.x * 0.3, 5.0, p.z * 0.25)))         # buttresses, as the game paints its walls: running down, leaning
        rb = abs(((xb / 1.9) % 1.0) - 0.5) * 2                                                   # 0 on a buttress's crest, 1 in the gully between two
        d = 0.1 * (rb ** 1.6) * (1 - 0.9 * math.exp(-(p.x / 2.8) ** 2))     # (no small lumps: they made dark specks)
        e = 0.2 * noise.noise(Vector((p.x * 0.6, 20.0, 1.0)))
        d -= (0.65 + 0.25 * e) * math.exp(-(p.x / 2.9) ** 2) * brow(p.z, e)          # the brow over the opening, standing out, ragged, and back to the wall's line at the top
        d -= 0.15 * math.exp(-((abs(p.x) - 2.9) / 0.9) ** 2) * (1 - smooth01(2.6, 3.6, p.z))     # the jambs standing out a little at either side
        p.y = p.y + d
    if p.z > TOP - 0.1:                                                  # the top: ragged, lower toward the sides
        p.z = TOP - 0.3 * (abs(p.x) / W) ** 1.5 + 0.12 * noise.noise(Vector((p.x * 0.9, 1.0, 5.0)))
    if abs(p.x) > W - 0.1:
        p.x = math.copysign(W - 0.55 * (0.5 + 0.5 * noise.noise(Vector((3.0, p.y * 0.3, p.z * 0.8)))), p.x)
face = obj('face', bm, C['rock'])
remesh(face, 0.075, 4, 0.6)
# ---- the passage: a lofted arch that flares out at the mouth, then narrows and lowers into the rock and bends away to the right; cut out of the face
def arch(cx, cy, w, h, n=30, wob=0.15, ph=0.0):
    pts = []
    for i in range(n):
        a = math.pi * i / (n - 1)                                        # 0: the right foot, pi: the left foot, over the top
        x = math.cos(a) * w / 2; z = (math.sin(a) ** 0.7) * h * (1 + 0.07 * math.cos(a))     # a little higher on the right: not a doorway
        r = 1 + wob * (1 - 0.6 * math.sin(a) ** 4) * noise.noise(Vector((math.cos(a) * 1.2 + ph * 0.5, math.sin(a) * 1.2, cy * 0.35)))   # calmer over the top: no peak
        pts.append(Vector((cx + x * r, cy, max(-0.3, z * r))))
    pts.append(Vector((cx - w / 2, cy, -0.3))); pts.append(Vector((cx + w / 2, cy, -0.3)))
    return pts
def _pass(y):
    """the passage at depth y: (middle, width, height)"""
    f = smooth01(0.2, 1.8, -y)                                           # the flare outside the face
    k = smooth01(0.0, 3.4, y)
    return 1.7 * smooth01(1.2, 6.0, y) ** 1.3, MW - 1.7 * k + 1.0 * f, MH - 0.7 * k + 0.5 * f
rings = []
for j in range(20):
    y = -1.8 + 8.8 * j / 19; cx, w, h = _pass(y); rings.append(arch(cx, y, w, h, ph=j * 0.6))
bm = bmesh.new(); vr = [[bm.verts.new(p) for p in r] for r in rings]; n = len(rings[0])
for a, b in zip(vr, vr[1:]):
    for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
bm.faces.new(vr[0][::-1]); bm.faces.new(vr[-1]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
tunnel = obj('tunnel', bm, C['rock'])
md = face.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = tunnel; md.solver = 'EXACT'
bpy.context.view_layer.objects.active = face; bpy.ops.object.modifier_apply(modifier=md.name)
bpy.data.objects.remove(tunnel)
HOLD = bpy.data.materials.new('_hold'); HOLD.use_nodes = True; _nt = HOLD.node_tree; _nt.nodes.clear(); _o = _nt.nodes.new('ShaderNodeOutputMaterial'); _h = _nt.nodes.new('ShaderNodeHoldout'); _nt.links.new(_h.outputs[0], _o.inputs[0])
face.data.materials.append(C['rock_in']); face.data.materials.append(HOLD); face.data.materials.append(C['turf'])
FMARK = face.data.attributes.new('freestyle_face', 'BOOLEAN', 'FACE')   # the faces whose edges get no line (Blender 5 keeps face marks as this attribute)
FRONT_Y = 0.25                                                           # the face's own surface (drawn over a man who walks in); behind it the inside
for pl in face.data.polygons:
    c, nn = pl.center, pl.normal
    if (nn.z > 0.6 and c.y > 0.25) or (abs(nn.x) > 0.8 and abs(c.x) > W - 1.2 and c.y > 0.3) or c.y > DEEP - 0.6: pl.material_index = 2   # the slab's top, sides and back: the game's own plateau and cliff are there
    elif nn.z > 0.55 and c.z > TOP - 0.2: pl.material_index = 2         # the top edge held out too: the game's own rim, its line, stones and grass, runs on over the piece (2026-10-22: a turf of our own read as a strip)
    pl.use_smooth = True
for pl in face.data.polygons: FMARK.data[pl.index].value = pl.material_index == 2 or abs(pl.center.x) > 3.6
# ---- the floor: earth running in from the threshold and a little down toward the back, tucked under the walls
bm = bmesh.new(); NX, NY = 24, 34
rows = []
for jy in range(NY + 1):
    y = -0.6 + 7.0 * jy / NY; cx, w, h = _pass(y)
    rows.append([bm.verts.new((cx + (i / NX - 0.5) * (w + 0.5), y, 0.03 - 0.3 * smooth01(0.8, 6.0, y) + 0.03 * noise.noise(Vector((i * 0.4, y * 0.6, 2.0))))) for i in range(NX + 1)])
for r0, r1 in zip(rows, rows[1:]):
    for i in range(NX): bm.faces.new((r0[i], r0[i + 1], r1[i + 1], r1[i]))
floor = obj('floor', bm, C['earth'], smooth=True)
# ---- stones lying where they fell, not a ring: one big block half sunk against the face on the left, a scatter of small ones and scree along the
# foot, rubble and the troll's leavings (a skull, a long bone) on the threshold
def boulder(name, c, size, n=14, tilt=0.0, m='stone', merge=15):
    bm = bmesh.new()
    for i in range(n):
        th, ph = U(0, TAU), math.acos(U(-1, 1)); r = U(0.72, 1.0); p = Vector((math.sin(ph) * math.cos(th) * r, math.sin(ph) * math.sin(th) * r, math.cos(ph) * r)); p.z = max(p.z, -0.4); bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts[:]); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.dissolve_limit(bm, angle_limit=rad(merge), verts=bm.verts[:], edges=bm.edges[:])
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(c)) @ Matrix.Rotation(tilt, 4, 'Z') @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)), verts=bm.verts)
    return obj(name, bm, C[m], smooth=False)
STONES = [boulder('b1', (-3.2, -0.8, -0.12), (0.58, 0.5, 0.42), n=30, tilt=0.5, merge=6), boulder('b2', (-2.45, -1.35, -0.02), (0.3, 0.26, 0.22), tilt=1.2),
          boulder('b3', (3.55, -0.85, -0.02), (0.36, 0.3, 0.3), tilt=2.1), boulder('b4', (2.95, -1.5, -0.02), (0.18, 0.16, 0.13))]
for k in range(9):                                                       # scree along the foot of the face, more on the right
    x = U(-3.9, 4.0); x = x if abs(x) > 2.3 else math.copysign(2.3 + abs(x) * 0.6, x)
    STONES.append(boulder('s%d' % k, (x, U(-1.0, -0.45), -0.01), (U(0.08, 0.16), U(0.07, 0.14), U(0.05, 0.1)), n=9, tilt=U(0, 3)))
for k in range(7):
    _y = U(0.0, 2.8); _c, _w, _h = _pass(_y); STONES.append(boulder('r%d' % k, (_c + U(-0.38, 0.38) * _w, _y, 0.0), (U(0.1, 0.22), U(0.09, 0.18), U(0.07, 0.13)), n=10))
STONES.append(boulder('bone_skull', (0.75, 0.9, 0.04), (0.17, 0.2, 0.14), n=14, m='bone', merge=8))
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.055, radius2=0.045, depth=0.62, matrix=Matrix.Translation((-0.35, 1.3, 0.06)) @ Matrix.Rotation(rad(90), 4, 'Y') @ Matrix.Rotation(rad(-25), 4, 'X'))
for e in (-1, 1): bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.075, matrix=Matrix.Translation((-0.35 + e * 0.29, 1.3 - e * 0.13, 0.06)))
STONES.append(obj('bone_long', bm, C['bone']))
# ---- turf along the rim (the plateau's own grass, a ragged edge, not cushions), moss on the lip, moss hanging off it in clumps, grass at the foot
def moss(name, pts, m, voxel=0.04, tufts=8):
    bm = bmesh.new(); allp = list(pts)
    for (c, r, s) in pts:
        for _ in range(tufts):
            th, ph = U(0, TAU), U(0.2, 2.3); nn = Vector((math.sin(ph) * math.cos(th) * s[0], math.sin(ph) * math.sin(th) * s[1], math.cos(ph) * s[2])); allp.append((tuple(Vector(c) + nn * r * 0.92), r * U(0.22, 0.34), (1, 1, 1)))
    for (c, r, s) in allp: bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=7, radius=r, matrix=Matrix.Translation(Vector(c)) @ Matrix.Diagonal((s[0], s[1], s[2], 1.0)))
    o = obj(name, bm, C[m]); remesh(o, voxel, 1); return o
def lip_y(x, z):                                                         # where the face's front stands at x, z (the lip included), for laying moss on it
    return -0.2 - 0.65 * math.exp(-(x / 2.9) ** 2) * brow(z)
C['blade'] = toon.material('c_blade', '#608c3e', None, 'cel', lit='#6e9a46', shade='#4f7a36', t_dark=0.4, t_lit=1.0)
bm = bmesh.new()
for x in [-2.7 + 5.4 * k / 8 + U(-0.2, 0.2) for k in range(9)]:
    z0 = TOP - 0.3 * (abs(x) / W) ** 1.5 - 0.02; y0 = lip_y(x, TOP) + 0.06
    for b in range(RNG.randint(3, 5)):
        bx = x + U(-0.12, 0.12); hgt = U(0.16, 0.3); lean = U(-0.08, 0.08)
        v0 = bm.verts.new((bx - 0.022, y0, z0)); v1 = bm.verts.new((bx + 0.022, y0, z0)); v2 = bm.verts.new((bx + lean, y0 - U(0.0, 0.06), z0 + hgt)); bm.faces.new((v0, v1, v2))
blades = obj('blades', bm, C['blade'], smooth=False); blades.visible_shadow = False
_bm = blades.data.attributes.new('freestyle_face', 'BOOLEAN', 'FACE')
for i in range(len(blades.data.polygons)): _bm.data[i].value = True
for o in (blades,): bpy.data.objects.remove(o)         # (the game's rim has its own blades)
TOPS = []
foot = moss('footgrass', [((x, U(-0.4, -0.25), 0.02), U(0.11, 0.16), (1.6, 0.9, 0.45)) for x in (-2.9, -2.35, 2.45, 3.0, 3.9)], 'grass', voxel=0.03, tufts=5)

face.visible_shadow = False; foot.visible_shadow = False
caster = bpy.data.objects.new('lip_shadow', face.data.copy()); coll.objects.link(caster); caster.location.y = 0.22; caster.visible_camera = False
# ---- render: the whole piece, then the front layer (the face and what grows on it: drawn over a man who walks in under the lip)
toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = True   # the lip throws its shadow over the threshold; the sun reaches in on the right
for k in ('rock', 'rock_in', 'earth', 'stone', 'bone'): deepen(C[k])   # after restyle, which rebuilds every material's nodes
def foot_dark(m, k=0.28, h=0.6):
    nt = m.node_tree; em = next(n for n in nt.nodes if n.type == 'EMISSION'); link = em.inputs['Color'].links[0]; src = link.from_socket; nt.links.remove(link)
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'; mr.inputs['From Min'].default_value = 0.0; mr.inputs['From Max'].default_value = h
    mr.inputs['To Min'].default_value = 1.0 - k; mr.inputs['To Max'].default_value = 1.0; nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
    nt.links.new(src, mul.inputs[6]); cc = nt.nodes.new('ShaderNodeCombineColor'); [nt.links.new(mr.outputs['Result'], cc.inputs[i]) for i in range(3)]; nt.links.new(cc.outputs[0], mul.inputs[7])
    nt.links.new(mul.outputs[2], em.inputs['Color'])
def fade_sides(m, x0=3.0, x1=4.1):
    nt = m.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'); link = out.inputs['Surface'].links[0]; src = link.from_socket; nt.links.remove(link)
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
    ab = nt.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; nt.links.new(sep.outputs['X'], ab.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'; mr.inputs['From Min'].default_value = x0; mr.inputs['From Max'].default_value = x1; nt.links.new(ab.outputs[0], mr.inputs['Value'])
    ho = nt.nodes.new('ShaderNodeHoldout'); mx = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(mr.outputs['Result'], mx.inputs[0]); nt.links.new(src, mx.inputs[1]); nt.links.new(ho.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
foot_dark(C['rock'])
for k in ('rock', 'turf', 'grass'): fade_sides(C[k])
def fade_back(m, y0=0.0, y1=0.3):                                       # just past the game's own rim (the face's top at y -0.2), then gone
    nt = m.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'); link = out.inputs['Surface'].links[0]; src = link.from_socket; nt.links.remove(link)
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'; mr.inputs['From Min'].default_value = y0; mr.inputs['From Max'].default_value = y1; nt.links.new(sep.outputs['Y'], mr.inputs['Value'])
    ho = nt.nodes.new('ShaderNodeHoldout'); mx = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(mr.outputs['Result'], mx.inputs[0]); nt.links.new(src, mx.inputs[1]); nt.links.new(ho.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
fade_back(C['turf'])
def fade_front(m, y0=-0.62, y1=-0.25):                                   # the earth of the threshold runs out into the game's own ground
    nt = m.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'); link = out.inputs['Surface'].links[0]; src = link.from_socket; nt.links.remove(link)
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.6; nt.links.new(geo.outputs['Position'], nz.inputs['Vector'])
    ad = nt.nodes.new('ShaderNodeMath'); ad.operation = 'MULTIPLY_ADD'; nt.links.new(nz.outputs['Fac'], ad.inputs[0]); ad.inputs[1].default_value = 0.35; nt.links.new(sep.outputs['Y'], ad.inputs[2])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'; mr.inputs['From Min'].default_value = y0 + 0.17; mr.inputs['From Max'].default_value = y1 + 0.17; mr.inputs['To Min'].default_value = 1.0; mr.inputs['To Max'].default_value = 0.0; nt.links.new(ad.outputs[0], mr.inputs['Value'])
    ho = nt.nodes.new('ShaderNodeHoldout'); mx = nt.nodes.new('ShaderNodeMixShader'); nt.links.new(mr.outputs['Result'], mx.inputs[0]); nt.links.new(src, mx.inputs[1]); nt.links.new(ho.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
fade_front(C['earth'])
vw = W * 2 + 1.0; vh = TOP * 0.9 + 3.2; aim = 1.6
cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
if hasattr(sc, 'eevee'):
    for a, v in (('use_shadows', True), ('shadow_ray_count', 2), ('shadow_step_count', 8)):
        if hasattr(sc.eevee, a): setattr(sc.eevee, a, v)
fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = rad(120)
toon.piece_line(fs, outer='#2b2f33', inner='#262a2e', at_colours=True)
fs.linesets.remove(fs.linesets['contour'])                               # no outer contour: the face melts into the painted cliff
for ls in fs.linesets:                                                   # nor on the edges of the held-out faces
    ls.select_by_face_marks = True; ls.face_mark_negation = 'EXCLUSIVE'; ls.face_mark_condition = 'ONE'
sc.render.filepath = os.path.join(OUT, 'caveMouth.png'); bpy.ops.render.render(write_still=True)
for o in [floor, caster] + STONES: o.hide_render = True                  # the front layer: the face's front, the turf and moss; the inside held out
for pl in face.data.polygons:
    if pl.material_index == 0 and pl.center.y > FRONT_Y: pl.material_index = 1
face.data.materials[1] = HOLD
sc.render.filepath = os.path.join(OUT, 'caveMouth_frontmask.png'); bpy.ops.render.render(write_still=True)
a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
meta = {'caveMouth': {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': TOP}}
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1); print('CAVE done', meta['caveMouth'])
