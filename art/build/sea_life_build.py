"""The sea's ambience creatures (2026-10-21, the studio; Robin: "ambiance creatures, like whales swimming by, sea gulls circling
around, some random fish about; not too much, but to give it some life"). Set pieces on the kraken's recipe: the game's camera
(35 degrees, the ink look) at 65 px a metre, the water a holdout plane for what swims (so the body is cut at the surface), no
plane for what flies; a JSON of marks beside each render (origin, the waterline cuts for foam, ppm). Each piece small.

  gull <dir> <frame>   a herring gull in flight, 1.3 m across: four frames of a wingbeat (down, level, up, level) in eight directions
                       (0 is flying toward the camera, then clockwise as the game's directions: s, sw, w, nw, n, ne, e, se), plus
                       frame 4, gliding, wings flat and swept. No water.
  whale <state>        a minke, 8 m: back1 (the blow-hole and the first of the back breaking), back2 (the back and the fin, the
                       spout's root), back3 (the back rolling under, the fin high), fluke1 (the tail lifting), fluke2 (the fluke up).
  fish <frame>         a herring-sized fish leaping, 0.3 m: three frames of the arc (out, top, in), side on; the game flips it.
  seal <frame>         a harbour seal's head above the water, 0.3 m: two frames (looking, dipping).
  shoal                a patch of a shoal just under the surface: a scatter of small pale fish bodies at 0.4 m deep, 4 m across,
                       for the water's drawing to show as a shimmer (the game may draw its own instead).

  node tools/blender.js sea_life_build.py -- gull 0 1 <out dir>   |  whale back2 <out dir>  |  fish 1 <out dir>  |  seal 0 <out dir>  |  shoal <out dir>"""
import bpy, bmesh, math, os, sys, random, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from mathutils import Vector, Matrix
import bpy_extras.object_utils as ou

argv = sys.argv[sys.argv.index('--') + 1:]
KIND = argv[0]; ARGS = argv[1:-1]; OUT = os.path.abspath(argv[-1]); os.makedirs(OUT, exist_ok=True)
rad = math.radians; TAU = 2 * math.pi; RNG = random.Random(5); U = RNG.uniform
PPM = 65.0; ELEV = 35.0; CE, SE = math.cos(rad(ELEV)), math.sin(rad(ELEV))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; vl = bpy.context.view_layer
coll = bpy.data.collections.new('Body'); sc.collection.children.link(coll)
WATER = bpy.data.collections.new('Water'); sc.collection.children.link(WATER)
C = {}
def cel3(name, base, lit, shade, hi=None, t_dark=0.66, t_lit=1.2):
    m = bpy.data.materials.new('s_' + name); m.use_nodes = True; nt = m.node_tree; n, L = nt.nodes, nt.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial'); em = n.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    v = toon._light(n, L); dark = toon._math(n, L, 'LESS_THAN', v, t_dark); bright = toon._math(n, L, 'GREATER_THAN', v, t_lit)
    col = toon._mix(n, L, 'MIX', bright, toon._mix(n, L, 'MIX', dark, toon.srgb(base), toon.srgb(shade)), toon.srgb(lit))
    if hi: col = toon._mix(n, L, 'MIX', toon._math(n, L, 'MULTIPLY', toon._math(n, L, 'GREATER_THAN', v, t_lit + 0.55), 0.55), col, toon.srgb(hi))
    col = toon._grain(n, L, col, toon.GRAIN_K, 320); L.new(col, em.inputs['Color']); L.new(em.outputs[0], out.inputs['Surface'])
    m.diffuse_color = (*toon.srgb(base), 1); C[name] = m; return m
cel3('white', '#e9e6dc', '#f4f2ea', '#b9bcc0'); cel3('greyw', '#9aa0a4', '#b4b9bc', '#747a80'); cel3('black', '#2a2c30', '#3a3d42', '#1a1c20'); cel3('beak', '#d8b24a', '#e8c866', '#a8862e'); cel3('eye', '#1a1a1a', '#1a1a1a', '#101010')
cel3('whale', '#3a4a52', '#56676f', '#26323a', hi='#7f8f96'); cel3('whalebelly', '#aab4b6', '#c6cecf', '#8a9598'); cel3('fish', '#9fb3b8', '#d2dfe2', '#6f8288', hi='#eef4f4'); cel3('fishback', '#3f5a66', '#5a7684', '#2b3f48')
cel3('seal', '#6a6660', '#868078', '#4a4844', hi='#a09a92'); cel3('sealdark', '#3e3b38', '#56524d', '#2a2825')

def water_surface():
    m = bpy.data.materials.new('_water'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); h = nt.nodes.new('ShaderNodeHoldout'); nt.links.new(h.outputs[0], out.inputs[0])
    me = bpy.data.meshes.new('water'); me.from_pydata([(-200, -200, -0.003), (200, -200, -0.003), (200, 200, -0.003), (-200, 200, -0.003)], [], [(0, 1, 2, 3)]); me.materials.append(m)
    o = bpy.data.objects.new('water', me); WATER.objects.link(o); return o
def obj(name, bm, m, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for mm in (m if isinstance(m, (list, tuple)) else [m]): me.materials.append(mm)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def ball(name, m, c, r, s=(1, 1, 1), rot=None, seg=16, rings=10):
    bm = bmesh.new(); M = Matrix.Translation(Vector(c)) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((r * s[0], r * s[1], r * s[2], 1.0)); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0, matrix=M); return obj(name, bm, m)
def loft(name, m, rings, seg=14, closed=True):
    """rings: a list of (centre, radius or (rx, rz), frame) along a body; a smooth tube through them, capped"""
    bm = bmesh.new(); rows = []
    for (c, r, (t, up, side)) in rings:
        rx, rz = (r if isinstance(r, tuple) else (r, r)); rows.append([bm.verts.new(Vector(c) + side * math.cos(TAU * i / seg) * rx + up * math.sin(TAU * i / seg) * rz) for i in range(seg)])
    for a, b in zip(rows, rows[1:]):
        for i in range(seg): bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    if closed: bm.faces.new(rows[0][::-1]); bm.faces.new(rows[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); return obj(name, bm, m)
def frames_xy(pts):
    out = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized(); up = Vector((0, 0, 1)); side = t.cross(up).normalized(); up = side.cross(t).normalized(); out.append((t, up, side))
    return out
def sheet_mesh(name, m, pts_left, pts_right, thick=0.02):
    """a flat wing or fin from two edge curves, solidified"""
    bm = bmesh.new(); rows = [(bm.verts.new(a), bm.verts.new(b)) for a, b in zip(pts_left, pts_right)]
    for (a0, b0), (a1, b1) in zip(rows, rows[1:]): bm.faces.new((a0, b0, b1, a1))
    o = obj(name, bm, m); so = o.modifiers.new('Solid', 'SOLIDIFY'); so.thickness = thick; so.offset = 0; return o

# ---------------------------------------------------------------- the gull
def gull(direction, frame):
    """a herring gull: white body and head, grey mantle and wings, black wingtips, a yellow bill; the wings beat down-level-up-level
    (frames 0 to 3) or glide flat and swept (frame 4). Flying along -Y (toward the camera) and turned by the direction."""
    yaw = -TAU * direction / 8
    flap = {0: -0.9, 1: 0.0, 2: 0.95, 3: 0.0, 4: 0.12}[frame]                                     # the wings' angle: down is negative
    sweep = 0.55 if frame == 4 else 0.25
    body = ball('gull_body', C['white'], (0, 0, 1.0), 0.17, s=(1.0, 2.1, 0.9)); head = ball('gull_head', C['white'], (0, -0.42, 1.08), 0.095, s=(1, 1.15, 1))
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.03, radius2=0.006, depth=0.14, matrix=Matrix.Translation((0, -0.58, 1.06)) @ Matrix.Rotation(rad(90), 4, 'X')); obj('gull_bill', bm, C['beak'])
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.09, radius2=0.14, depth=0.26, matrix=Matrix.Translation((0, 0.45, 0.98)) @ Matrix.Rotation(rad(-90), 4, 'X') @ Matrix.Diagonal((1.0, 0.25, 1.0, 1.0))); obj('gull_tail', bm, C['white'])
    for k, e in enumerate(((-0.055, -0.44, 1.12), (0.055, -0.44, 1.12))): ball('gull_eye%d' % k, C['eye'], e, 0.016)
    for sgn in (-1, 1):                                                                           # the wings: a flat sheet, the arm out and the hand bent back, the tips black
        A = 0.62; Hd = 0.6; a = flap
        root = Vector((sgn * 0.12, -0.05, 1.05)); elbow = root + Vector((sgn * A * math.cos(a), sweep * 0.3, A * math.sin(a)))
        tip = elbow + Vector((sgn * Hd * math.cos(a * 1.25), sweep * 0.8 + 0.15, Hd * math.sin(a * 1.25)))
        le = [root + Vector((0, -0.22, 0)), elbow + Vector((0, -0.18, 0)), tip + Vector((0, -0.04, 0))]; te = [root + Vector((0, 0.18, 0)), elbow + Vector((0, 0.16, 0)), tip + Vector((0, 0.06, 0))]
        # the arm (grey) and the hand (grey with black tips) as two sheets
        sheet_mesh('gull_wing%s_arm' % sgn, C['greyw'], le[:2], te[:2]); sheet_mesh('gull_wing%s_hand' % sgn, C['greyw'], le[1:], te[1:])
        sheet_mesh('gull_wing%s_tip' % sgn, C['black'], [le[2] + (le[1] - le[2]) * 0.22, le[2]], [te[2] + (te[1] - te[2]) * 0.22, te[2]], 0.025)
    for o in coll.objects: o.rotation_euler = (0, 0, yaw)
    return dict(view_w=2.2, view_h=1.8, aim=1.0, water=False)

# ---------------------------------------------------------------- the whale (a minke, 8 m)
def whale(state):
    """a minke: a dark spindle 8 m long swimming along +X; only the back breaks the surface (the holdout cuts the rest), the fin
    two thirds along; the fluke states lift the tail stock and the fluke clear of the water while the body is under"""
    water_surface(); Rm = 0.85 * 1.1                                                                 # the body's half-height at the thickest
    top = {'back1': 0.3, 'back2': 0.55, 'back3': 0.45, 'fluke1': -0.2, 'fluke2': -0.4}[state]      # how high the back's top stands above the water
    pitch = {'back1': 0.05, 'back2': 0.0, 'back3': -0.12, 'fluke1': -0.3, 'fluke2': -0.45}[state]  # nose down is negative (the back rolls under toward the tail)
    zc = top - Rm
    pts = [Vector((x, 0, 0)) for x in (-3.6, -2.6, -1.4, 0.0, 1.4, 2.6, 3.6)]; R = [0.12, 0.42, 0.72, 0.85, 0.78, 0.52, 0.22]
    F = frames_xy(pts); rot = Matrix.Rotation(pitch, 4, 'Y'); place = lambda o: (setattr(o, 'rotation_euler', (0, pitch, 0)), setattr(o, 'location', (0, 0, zc)))
    place(loft('whale_body', C['whale'], [(p, (r, r * 1.1), f) for p, r, f in zip(pts, R, F)], seg=18))
    place(sheet_mesh('whale_fin', C['whale'], [Vector((1.3, 0, 0.78)), Vector((1.6, 0, 1.15)), Vector((1.95, 0, 1.25))], [Vector((1.9, 0, 0.78)), Vector((2.0, 0, 1.0)), Vector((2.05, 0, 1.18))], 0.08))
    if state.startswith('fluke'):                                                                   # the tail stock rising out of the water to the fluke
        lift = {'fluke1': 0.9, 'fluke2': 1.7}[state]; stock = [Vector((-2.4, 0, -0.9)), Vector((-3.0, 0, -0.2)), Vector((-3.5, 0, lift * 0.55)), Vector((-3.8, 0, lift))]
        Fs = frames_xy(stock); loft('whale_stock', C['whale'], [(p, (r, r * 1.2), f) for p, r, f in zip(stock, [0.5, 0.4, 0.3, 0.2], Fs)], seg=12)
        tipz = lift; base = Vector((-3.8, 0, tipz))
        for sgn in (-1, 1):
            sheet_mesh('whale_fluke%s' % sgn, C['whale'], [base + Vector((0.2, 0, 0.05)), base + Vector((-0.1, sgn * 0.9, 0.3)), base + Vector((-0.5, sgn * 1.5, 0.55))], [base + Vector((-0.3, 0, -0.05)), base + Vector((-0.5, sgn * 0.9, 0.15)), base + Vector((-0.7, sgn * 1.45, 0.45))], 0.1)
    return dict(view_w=11.0, view_h=6.0, aim=0.3, water=True)

# ---------------------------------------------------------------- the leaping fish (0.3 m), side on, along +X
def fish(frame):
    water_surface(); H = {0: 0.25, 1: 0.55, 2: 0.3}[frame]; ang = {0: rad(50), 1: rad(5), 2: rad(-50)}[frame]
    pts = [Vector((x, 0, 0)) for x in (-0.15, -0.08, 0.0, 0.08, 0.15)]; R = [0.012, 0.035, 0.045, 0.03, 0.01]; F = frames_xy(pts)
    o = loft('fish_body', C['fish'], [(p, (r, r * 1.4), f) for p, r, f in zip(pts, R, F)], seg=10); o.rotation_euler = (0, -ang, 0); o.location = (0, 0, H)
    bk = loft('fish_back', C['fishback'], [(p + Vector((0, 0, r * 0.5)), (r * 0.8, r * 0.7), f) for p, r, f in zip(pts, R, F)], seg=8); bk.rotation_euler = (0, -ang, 0); bk.location = (0, 0, H)
    tl = sheet_mesh('fish_tail', C['fishback'], [Vector((-0.15, 0, 0.0)), Vector((-0.22, 0, 0.05))], [Vector((-0.15, 0, -0.0)), Vector((-0.22, 0, -0.05))], 0.01); tl.rotation_euler = (0, -ang, 0); tl.location = (0, 0, H)
    return dict(view_w=1.2, view_h=1.2, aim=0.4, water=True)

# ---------------------------------------------------------------- the seal's head (0.3 m)
def seal(frame):
    water_surface(); dip = {0: 0.0, 1: -0.12}[frame]
    ball('seal_head', C['seal'], (0, 0, 0.12 + dip), 0.16, s=(1.0, 1.25, 0.95)); ball('seal_muzzle', C['seal'], (0, -0.17, 0.08 + dip), 0.09, s=(1.0, 1.0, 0.8))
    ball('seal_nose', C['sealdark'], (0, -0.25, 0.1 + dip), 0.028);
    for k, e in enumerate(((-0.07, -0.11, 0.17 + dip), (0.07, -0.11, 0.17 + dip))): ball('seal_eye%d' % k, C['eye'], e, 0.022)
    return dict(view_w=1.0, view_h=1.0, aim=0.1, water=True)

# ---------------------------------------------------------------- the shoal: small fish bodies just under the surface (seen through the holdout? no: above a dark plane instead)
def shoal():
    for k in range(60):
        x, y = U(-2, 2), U(-1.2, 1.2); a = U(-0.4, 0.4) + 0.3; o = ball('shoal%d' % k, C['fish'], (x, y, 0.02), 0.04, s=(2.6, 0.8, 0.4), rot=Matrix.Rotation(a, 4, 'Z'), seg=8, rings=5)
    return dict(view_w=5.0, view_h=3.5, aim=0.0, water=False)

if KIND == 'gull': cfg = gull(int(ARGS[0]), int(ARGS[1])); tag = 'gull_%s_%d' % (['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'][int(ARGS[0])], int(ARGS[1]))
elif KIND == 'whale': cfg = whale(ARGS[0]); tag = 'whale_' + ARGS[0]
elif KIND == 'fish': cfg = fish(int(ARGS[0])); tag = 'fish_%d' % int(ARGS[0])
elif KIND == 'seal': cfg = seal(int(ARGS[0])); tag = 'seal_%d' % int(ARGS[0])
else: cfg = shoal(); tag = 'shoal'
toon.restyle('cel'); toon.world(sc, style='cel'); toon.sun('cel')
vw, vh = cfg['view_w'], cfg['view_h']; aim_z = cfg['aim']
cam = toon.camera(sc, ELEV, vw, aim_z); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 300
sc.render.engine = 'BLENDER_EEVEE'; sc.render.resolution_x = int(vw * PPM); sc.render.resolution_y = int(vh * PPM); sc.render.resolution_percentage = 100
sc.render.film_transparent = True; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.filter_size = 1.0; sc.eevee.taa_render_samples = 16
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.display_settings.display_device = 'sRGB'
fs = toon.freestyle(sc, vl, 0.7, None, 'cel'); fs.linesets['inner'].select_material_boundary = True
toon.piece_line(fs)
for ls in fs.linesets: ls.select_by_collection = True; ls.collection = WATER; ls.collection_negation = 'EXCLUSIVE'
sc.render.filepath = os.path.join(OUT, tag + '.png'); bpy.ops.render.render(write_still=True)
dg = bpy.context.evaluated_depsgraph_get(); rx, ry = sc.render.resolution_x, sc.render.resolution_y
proj = lambda p: (lambda v: [round(v.x * rx, 1), round((1 - v.y) * ry, 1)])(ou.world_to_camera_view(sc, cam, p))
water = []
if cfg['water']:
    for o in coll.objects:
        if o.type != 'MESH': continue
        ev = o.evaluated_get(dg); me = ev.to_mesh(); M = ev.matrix_world
        for e in me.edges:
            a, b = M @ me.vertices[e.vertices[0]].co, M @ me.vertices[e.vertices[1]].co
            if (a.z > 0) != (b.z > 0): water.append(proj(a + (b - a) * (-a.z / (b.z - a.z))))
        ev.to_mesh_clear()
json.dump({'origin': proj(Vector((0, 0, 0))), 'water': water, 'ppm': PPM, 'kind': KIND, 'args': ARGS}, open(os.path.join(OUT, tag + '.json'), 'w'))
print('SEALIFE', tag, rx, 'x', ry)
