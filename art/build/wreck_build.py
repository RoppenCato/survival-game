"""The wreck on the starter island's beach as a set piece (2026-10-21, the kraken round, item 11; the game drew it in code, stylelab.js
wreckedBoat): the hero's boat thrown up on the sand, listing away from the eye, its stern sunk, a hole stove in the near side with
the ribs showing through, the mast snapped, the striped sail torn and hanging over the gunwale, a broken oar and two loose planks.
Clinker strakes in two woods so the line falls between them (the line only where colours meet); chosen tones; one hot-ish thing,
the sail's faded red stripes. Rendered from the set pieces' camera (35 degrees above the ground, 4 px a game unit when packed).
  node tools/blender.js wreck_build.py -- <out dir>
Writes wreckedBoat.png and meta.json (the origin's pixel, the pixels a metre), for tools/pieces_pack.js."""
import bpy, bmesh, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = os.path.abspath(argv[0]); os.makedirs(OUT, exist_ok=True)
UNIT = 39 / 1.8; PPM = 4 * UNIT; PX = 2
rnd = random.Random(5); U = lambda a, b: a + (b - a) * rnd.random(); TAU = 2 * math.pi

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; coll = bpy.data.collections.new('Piece'); sc.collection.children.link(coll)
C = {}
for k, v in {'strake': '#7a5638', 'strake2': '#68482f', 'hollow': '#2e221c', 'rib': '#6b4a32', 'mast': '#76553a', 'split': '#b89466',
             'sail': '#d6c9ad', 'sailred': '#8c4636', 'oar': '#86643f', 'plank': '#7d5c3c', 'rope': '#9a846a', 'weed': '#4f6b3a'}.items():
    if k == 'weed':
        lit, shade = toon.chosen_tones(v, lit_dl=0.09, shade_dl=0.075, cool_k=0.2); C[k] = toon.material('w_' + k, v, None, 'cel', lit=lit, shade=shade, t_dark=0.5, t_lit=1.0)
    else: C[k] = toon.material('w_' + k, v, None, 'cel', t_dark=0.62, t_lit=1.0)

def obj(name, bm, mats, smooth=True):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in (mats if isinstance(mats, (list, tuple)) else [mats]): me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o
def tube(name, pts, r0, r1, mat, seg=8):
    bm = bmesh.new(); rows = []; n = len(pts)
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized(); a = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        s1 = t.cross(a).normalized(); s2 = t.cross(s1).normalized(); r = r0 + (r1 - r0) * i / max(1, n - 1)
        rows.append([bm.verts.new(p + (s1 * math.cos(TAU * j / seg) + s2 * math.sin(TAU * j / seg)) * r) for j in range(seg)])
    for a, b in zip(rows, rows[1:]):
        for j in range(seg): bm.faces.new((a[j], a[(j + 1) % seg], b[(j + 1) % seg], b[j]))
    bm.faces.new(rows[0][::-1]); bm.faces.new(rows[-1]); return obj(name, bm, mat)

# ---- the hull: sections along X, each a U from gunwale to gunwale; a strake every two rows in the other wood
L, B, H, RISE = 3.8, 0.8, 0.6, 0.95; NS, NM = 44, 16                      # a Viking faering: the sheer sweeping up to high stem and stern
def section(x, k=1.0):
    t = x / (L / 2); b = B * max(0.0, 1 - t * t) ** 0.55 * k + 0.012; top = H + RISE * abs(t) ** 3.2; pts = []
    for j in range(NM + 1):
        ph = -math.pi / 2 + math.pi * j / NM; y = b * math.sin(ph); z = top * (1 - math.cos(ph) ** 0.85) * k + (1 - k) * 0.06
        pts.append(Vector((x, y, z)))
    return pts
def hull_mesh(name, k, mats, matfn, flip=False):
    bm = bmesh.new(); rows = [[bm.verts.new(p) for p in section(-L / 2 + L * i / NS, k)] for i in range(NS + 1)]
    for i in range(NS):
        for j in range(NM):
            f = (rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]); f = bm.faces.new(f[::-1] if flip else f); f.material_index = matfn(i, j)
    return bm, rows
HOLE = lambda c: (c.x + 0.35) ** 2 / 0.42 ** 2 + (c.z - 0.33) ** 2 / 0.2 ** 2 < 1 and c.y < -0.15      # stove in the near side, below the gunwale
bm, rows = hull_mesh('hull', 1.0, None, lambda i, j: 1 if (j // 2) % 2 else 0)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if HOLE(f.calc_center_median())], context='FACES')
for f in bm.faces: pass
outer = obj('hull', bm, [C['strake'], C['strake2']])
sol = outer.modifiers.new('solid', 'SOLIDIFY'); sol.thickness = 0.035; sol.offset = 1.0; sol.use_rim = True
bmi, _ = hull_mesh('inside', 0.95, None, lambda i, j: 0, flip=True); inner = obj('inside', bmi, [C['hollow']])        # the dark hollow seen through the hole and over the far gunwale
for xr in (-1.1, -0.65, -0.2, 0.3, 0.8, 1.25):                                                                      # the ribs, inside, showing through the hole
    tube('rib%.2f' % xr, section(xr, 0.93)[1:-1], 0.028, 0.028, C['rib'], seg=6)
for sx in (-1, 1):                                                                                                   # the gunwales, a darker rail along each side
    tube('gunwale%d' % sx, [section(-L / 2 + L * i / NS)[0 if sx < 0 else -1] + Vector((0, 0, 0.01)) for i in range(1, NS)], 0.035, 0.035, C['strake2'], seg=6)
for sx, nm in ((-1, 'stem'), (1, 'sternpost')):                                                                  # the posts rise above the sheer and curl inward at the top
    e = L / 2; pts = [Vector((sx * (e - 0.35 + 0.35 * u), 0, 0.05 + (H + RISE) * u ** 1.4)) for u in (0.0, 0.3, 0.6, 0.85, 1.0)]
    pts += [Vector((sx * (e + 0.08), 0, H + RISE + 0.22)), Vector((sx * (e - 0.04), 0, H + RISE + 0.36)), Vector((sx * (e - 0.14), 0, H + RISE + 0.3))]
    tube(nm, pts, 0.06, 0.04, C['strake2'])
# ---- the snapped mast, a jagged pale break at its top
m0 = Vector((-0.05, 0.0, 0.08)); m1 = m0 + Vector((0.08, 0.06, 1.05)); tube('mast', [m0, m0.lerp(m1, 0.5), m1], 0.07, 0.06, C['mast'])
for k in range(5):
    a = TAU * k / 5 + U(-0.3, 0.3); bmj = bmesh.new()
    base = [bmj.verts.new(m1 + Vector((math.cos(a + d) * 0.058, math.sin(a + d) * 0.058, 0))) for d in (-0.5, 0.5)] + [bmj.verts.new(m1 + Vector((math.cos(a) * 0.02, math.sin(a) * 0.02, 0)))]
    tip = bmj.verts.new(m1 + Vector((math.cos(a) * 0.03, math.sin(a) * 0.03, U(0.1, 0.24))))
    bmesh.ops.convex_hull(bmj, input=bmj.verts[:])
    obj('splinter%d' % k, bmj, C['split'], smooth=False)
# ---- the torn sail: a sheet from the mast's stub draped over the near gunwale, faded red stripes, its edge ragged
bms = bmesh.new(); NU, NV = 14, 10; grid = []
for i in range(NU + 1):
    u = i / NU; row = []
    for j in range(NV + 1):
        v = j / NV; x = -0.25 - 0.95 * u + 0.08 * math.sin(v * 5 + u * 3); y = -0.05 - 0.55 * v - 0.25 * v * v
        z = 0.95 - 0.55 * v - 0.25 * u + 0.06 * math.sin(u * 9 + v * 4) - max(0.0, v - 0.75) * 1.4
        if j == NV: x += U(-0.06, 0.06); z += U(-0.08, 0.02)
        row.append(bms.verts.new((x, y, z)))
    grid.append(row)
for i in range(NU):
    for j in range(NV):
        f = bms.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1])); f.material_index = 1 if (i // 2) % 2 else 0
sail = obj('sail', bms, [C['sail'], C['sailred']]); s2 = sail.modifiers.new('solid', 'SOLIDIFY'); s2.thickness = 0.012
# ---- on the sand: a broken oar, two loose planks, a strand of weed on the hull
tube('oar', [Vector((1.5, -1.0, 0.04)), Vector((2.5, -1.25, 0.05))], 0.03, 0.028, C['oar'])
bmo = bmesh.new(); bmesh.ops.create_cube(bmo, size=1.0); bmesh.ops.transform(bmo, matrix=Matrix.Translation((2.65, -1.29, 0.04)) @ Matrix.Rotation(-0.25, 4, 'Z') @ Matrix.Diagonal((0.42, 0.13, 0.025, 1)), verts=bmo.verts); obj('blade', bmo, C['oar'], smooth=False)
for k, (c, r, l) in enumerate((((-2.6, -0.9, 0.03), 0.4, 1.3), ((1.0, -1.45, 0.03), -0.2, 1.0))):
    bmp = bmesh.new(); bmesh.ops.create_cube(bmp, size=1.0); bmesh.ops.transform(bmp, matrix=Matrix.Translation(c) @ Matrix.Rotation(r, 4, 'Z') @ Matrix.Diagonal((l, 0.16, 0.035, 1)), verts=bmp.verts); obj('plank%d' % k, bmp, C['plank'], smooth=False)
tube('weed', [Vector((x, -0.62 + 0.004 * x * x, 0.32 + 0.05 * math.sin(x * 4))) for x in (0.4, 0.7, 1.0, 1.3)], 0.025, 0.012, C['weed'])
# ---- thrown up on the beach: listing away, the stern sunk; everything below the sand cut off
boat = [o for o in coll.objects if not o.name.startswith(('oar', 'blade', 'plank'))]
R = Matrix.Translation((0, 0.1, -0.04)) @ Matrix.Rotation(math.radians(-5), 4, 'Y') @ Matrix.Rotation(math.radians(-24), 4, 'X') @ Matrix.Rotation(math.radians(-7), 4, 'Z')   # listing away from the eye, the near side and its hole toward us
for o in boat: o.matrix_world = R @ o.matrix_world
bpy.context.view_layer.update()
for o in boat:
    for md in list(o.modifiers): bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
    o.data.transform(o.matrix_world); o.matrix_world = Matrix.Identity(4)
    bmc = bmesh.new(); bmc.from_mesh(o.data); bmesh.ops.bisect_plane(bmc, geom=bmc.verts[:] + bmc.edges[:] + bmc.faces[:], plane_co=(0, 0, 0.0), plane_no=(0, 0, 1), clear_inner=True); bmc.to_mesh(o.data); bmc.free()

# ---- render
toon.restyle('cel'); toon.world(sc, style='cel'); sun = toon.sun('cel'); sun.data.use_shadow = False
H_, W_ = 2.3, 6.4; vw = W_; vh = H_ * 0.9 + 1.7; aim = 0.75
cam = toon.camera(sc, 35, vw, aim); cam.data.sensor_fit = 'HORIZONTAL'; cam.data.clip_end = 100
toon.setup_render(sc, 10, PX, 16); sc.render.resolution_x = int(round(vw * PPM * PX)); sc.render.resolution_y = int(round(vh * PPM * PX))
fs = toon.freestyle(sc, bpy.context.view_layer, PX, None, 'cel'); fs.crease_angle = math.radians(100); toon.piece_line(fs, at_colours=True)
sc.render.filepath = os.path.join(OUT, 'wreckedBoat.png'); bpy.ops.render.render(write_still=True)
a = world_to_camera_view(sc, cam, Vector((0, 0, 0)))
meta = {'wreckedBoat': {'w': sc.render.resolution_x, 'h': sc.render.resolution_y, 'anchor': {'x': round(a.x * sc.render.resolution_x, 1), 'y': round((1 - a.y) * sc.render.resolution_y, 1)}, 'px': PX, 'ppm': PPM, 'height_m': H_}}
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1); print('WRECK done', meta['wreckedBoat']['w'], 'x', meta['wreckedBoat']['h'])
