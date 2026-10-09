"""The shared look for everything rendered from Blender (2026-10-09), in three styles for Robin's style test:

  cel      2 to 3 tone cel shading, a cool shadow side, a small warm light, a warm rim light from the sun's side, grain,
           and the ink line heavy toward the lower right (the art direction's line).
  painted  Bauer: soft painted shading with no hard cut, colours muted toward olive and brown, a mottled watercolour
           texture, pigment pooling at the edges, a thin brown wobbling line.
  folk     flat Norse folk art: flat fills, no shading, a bold even outline, and knotwork or woven patterns on the trim.

A material remembers its colour and pattern (custom properties 'hex' and 'pattern'), so restyle(style) can rebuild every
material's nodes for another style at render time. The sun sits upper left of the camera (which looks along +Y), the
camera is orthographic at 35 degrees above the ground, and the Freestyle line changes with the style."""
import bpy, math
from mathutils import Vector

INK_HEX = '#231a16'                   # the warm brown-black ink
SHADOW_TINT = (0.60, 0.66, 0.86)      # the shadow side is cooler and bluer, never the same hue darkened
LIGHT_TINT = (1.0, 0.95, 0.80)        # the small warm highlight
RIM_COL = (1.0, 0.80, 0.52)           # the warm rim
PAINT_MUTE = (0.42, 0.40, 0.30)       # the painted style pulls every colour toward this olive-brown
SUN_DIR = Vector((0.55, 0.45, -0.70)).normalized()   # the light travels down, to the right and away: it comes from upper left, in front
# the fit with the world (2026-10-09, Robin: match the Night Forest): a cool green ambient over every fill, the shadow side toward
# the scene's blue-green, a subtle rim, the grain as fine specks at the strength of the kit's grain
# Two scenes to fit (2026-10-09): 'day', the starter island by daylight as the game shows it (Robin: the reference), and 'night',
# the Night Forest. The scene sets the ambient over every fill, the shadow side's tint, the rim's strength and the world's air.
SCENES = {
    'day': {'ambient': (1.0, 0.99, 0.95), 'shadow': (0.60, 0.66, 0.86), 'rim': 0.3, 'air': (0.12, 0.12, 0.115)},
    'night': {'ambient': (0.84, 0.95, 0.90), 'shadow': (0.52, 0.66, 0.70), 'rim': 0.45, 'air': (0.085, 0.105, 0.10)},
}
SCENE = 'day'
AMBIENT_TINT = SCENES[SCENE]['ambient']
SHADOW_TINT_FIT = SCENES[SCENE]['shadow']
RIM_K = SCENES[SCENE]['rim']
GRAIN_K = 0.075
def set_scene(name):
    global SCENE, AMBIENT_TINT, SHADOW_TINT_FIT, RIM_K
    SCENE = name if name in SCENES else 'day'; sc = SCENES[SCENE]; AMBIENT_TINT = sc['ambient']; SHADOW_TINT_FIT = sc['shadow']; RIM_K = sc['rim']
FACE = 'neutral'                      # the face texture drawn on a material with the 'face' property: <eyes>-<expression> or neutral
EYES = 'dot'

def srgb(hexs):
    h = hexs.lstrip('#'); v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in v)

def _sock(node, name, kind, outputs=False):
    for s in (node.outputs if outputs else node.inputs):
        if s.name == name and s.type == kind: return s
    raise KeyError(name + ' ' + kind)

def _is_sock(v): return hasattr(v, 'is_output')

def _mix(n, L, blend, fac, a, b):
    """a Mix node in RGBA: fac, a, b may be sockets or values"""
    m = n.new('ShaderNodeMix'); m.data_type = 'RGBA'; m.blend_type = blend
    for sock, v in ((m.inputs['Factor'], fac), (_sock(m, 'A', 'RGBA'), a), (_sock(m, 'B', 'RGBA'), b)):
        if _is_sock(v): L.new(v, sock)
        elif isinstance(v, (int, float)): sock.default_value = v
        else: sock.default_value = (*v, 1)
    return _sock(m, 'Result', 'RGBA', True)

def _math(n, L, op, a, b):
    m = n.new('ShaderNodeMath'); m.operation = op
    for sock, v in ((m.inputs[0], a), (m.inputs[1], b)):
        if _is_sock(v): L.new(v, sock)
        else: sock.default_value = v
    return m.outputs[0]

def _light(n, L):
    """the diffuse light on the surface as a value (Shader to RGB)"""
    dif = n.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
    rgb = n.new('ShaderNodeShaderToRGB'); L.new(dif.outputs[0], rgb.inputs[0])
    val = n.new('ShaderNodeRGBToBW'); L.new(rgb.outputs['Color'], val.inputs['Color'])
    return val.outputs[0]

def _gray(n, L, v):
    c = n.new('ShaderNodeCombineColor'); L.new(v, c.inputs[0]); L.new(v, c.inputs[1]); L.new(v, c.inputs[2]); return c.outputs[0]

def _grain(n, L, col, strength, scale=140):
    tc = n.new('ShaderNodeTexCoord'); nz = n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 1.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    g = _math(n, L, 'MULTIPLY', _math(n, L, 'SUBTRACT', nz.outputs['Fac'], 0.5), strength)
    return _mix(n, L, 'ADD', 1.0, col, _gray(n, L, g))

def _rim(n, L):
    """1 where the surface turns away from the camera on the sun's side: the warm rim"""
    geo = n.new('ShaderNodeNewGeometry'); vm = n.new('ShaderNodeVectorMath'); vm.operation = 'DOT_PRODUCT'
    L.new(geo.outputs['Normal'], vm.inputs[0]); vm.inputs[1].default_value = (-SUN_DIR.x, -SUN_DIR.y, -SUN_DIR.z)
    lit = _math(n, L, 'GREATER_THAN', vm.outputs['Value'], 0.15)
    lw = n.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.45
    edge = _math(n, L, 'GREATER_THAN', lw.outputs['Facing'], 0.62)
    return _math(n, L, 'MULTIPLY', lit, edge)

def _pattern(n, L, kind):
    """A 0/1 mask of a trim pattern on a ring-shaped band, from the mesh's Generated coordinates (0..1 across its box): the
    angle round the band's axis and the position across the band. 'knot:z' is two interlaced strands (a twist of knotwork)
    on a band round Z, 'knot:x' the same on a band along X (a cuff), 'woven:z' a lattice of diamonds."""
    kind, axis = (kind.split(':') + ['z'])[:2]
    tc = n.new('ShaderNodeTexCoord'); sep = n.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs[0])
    across, u, v = (sep.outputs['X'], sep.outputs['Y'], sep.outputs['Z']) if axis == 'x' else (sep.outputs['Z'], sep.outputs['X'], sep.outputs['Y'])
    ang = _math(n, L, 'ARCTAN2', _math(n, L, 'SUBTRACT', v, 0.5), _math(n, L, 'SUBTRACT', u, 0.5))   # -pi..pi round the band
    t = _math(n, L, 'MULTIPLY', ang, 14 / math.pi)                                                      # 14 repeats round the band
    z = _math(n, L, 'ADD', _math(n, L, 'MULTIPLY', _math(n, L, 'SUBTRACT', across, 0.5), 1.0), 0.5)    # 0..1 across the band
    if kind == 'woven':
        a = _math(n, L, 'ABSOLUTE', _math(n, L, 'SUBTRACT', _math(n, L, 'FRACT', _math(n, L, 'ADD', t, z), 0.0), 0.5), 0.0)
        b = _math(n, L, 'ABSOLUTE', _math(n, L, 'SUBTRACT', _math(n, L, 'FRACT', _math(n, L, 'SUBTRACT', t, z), 0.0), 0.5), 0.0)
        return _math(n, L, 'MAXIMUM', _math(n, L, 'LESS_THAN', a, 0.12), _math(n, L, 'LESS_THAN', b, 0.12))
    s1 = _math(n, L, 'ADD', _math(n, L, 'MULTIPLY', _math(n, L, 'SINE', _math(n, L, 'MULTIPLY', t, math.pi), 0.0), 0.3), 0.5)
    s2 = _math(n, L, 'SUBTRACT', 1.0, s1)
    d1 = _math(n, L, 'ABSOLUTE', _math(n, L, 'SUBTRACT', z, s1), 0.0); d2 = _math(n, L, 'ABSOLUTE', _math(n, L, 'SUBTRACT', z, s2), 0.0)
    return _math(n, L, 'MAXIMUM', _math(n, L, 'LESS_THAN', d1, 0.13), _math(n, L, 'LESS_THAN', d2, 0.13))

def build_nodes(m, style):
    """Rebuild a material's nodes for a style from its 'hex' and 'pattern' properties."""
    base = srgb(m['hex']); pattern = m.get('pattern', '')
    m.use_nodes = True; nt = m.node_tree; n, L = nt.nodes, nt.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial'); em = n.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    if style == 'folk':
        if pattern:
            col = _mix(n, L, 'MIX', _pattern(n, L, pattern), base, (0.93, 0.88, 0.76) if pattern.startswith('knot') else (0.80, 0.32, 0.26))
            L.new(col, em.inputs['Color'])
        else:
            em.inputs['Color'].default_value = (*base, 1)
    elif style == 'painted':
        v = _light(n, L); mute = tuple(base[i] * 0.8 + PAINT_MUTE[i] * 0.2 for i in range(3))
        shadow = tuple(mute[i] * (0.30, 0.34, 0.50)[i] for i in range(3)); light = tuple(min(1, mute[i] * 0.78 + LIGHT_TINT[i] * 0.25) for i in range(3))
        k1 = n.new('ShaderNodeMapRange'); k1.inputs['From Min'].default_value = 0.25; k1.inputs['From Max'].default_value = 1.0; k1.interpolation_type = 'SMOOTHSTEP'; L.new(v, k1.inputs['Value'])
        k2 = n.new('ShaderNodeMapRange'); k2.inputs['From Min'].default_value = 1.0; k2.inputs['From Max'].default_value = 1.3; k2.interpolation_type = 'SMOOTHSTEP'; L.new(v, k2.inputs['Value'])
        col = _mix(n, L, 'MIX', k2.outputs['Result'], _mix(n, L, 'MIX', k1.outputs['Result'], shadow, mute), light)
        tc = n.new('ShaderNodeTexCoord'); nz = n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 9; nz.inputs['Detail'].default_value = 4; nz.inputs['Roughness'].default_value = 0.7
        L.new(tc.outputs['Object'], nz.inputs['Vector'])
        mottle = _math(n, L, 'ADD', _math(n, L, 'MULTIPLY', _math(n, L, 'SUBTRACT', nz.outputs['Fac'], 0.5), 0.3), 1.0)
        col = _mix(n, L, 'MULTIPLY', 1.0, col, _gray(n, L, mottle))
        lw = n.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.55
        pool = _math(n, L, 'SUBTRACT', 1.0, _math(n, L, 'MULTIPLY', lw.outputs['Facing'], 0.34))
        col = _mix(n, L, 'MULTIPLY', 1.0, col, _gray(n, L, pool))
        col = _grain(n, L, col, 0.08, 220)
        L.new(col, em.inputs['Color'])
    else:   # cel
        v = _light(n, L)
        base_t = tuple(base[i] * AMBIENT_TINT[i] for i in range(3))
        dark = _math(n, L, 'LESS_THAN', v, 0.66); lit = _math(n, L, 'GREATER_THAN', v, 0.9)
        shadow = tuple(base_t[i] * SHADOW_TINT_FIT[i] for i in range(3)); light = tuple(base_t[i] * 0.8 + LIGHT_TINT[i] * 0.16 for i in range(3))
        bsock = base_t
        if m.get('face'):             # the painted face laid over the skin before the shading: a decal projected from the front
            bsock = _decal(n, L, base_t)
        col = _mix(n, L, 'MIX', lit, _mix(n, L, 'MIX', dark, bsock, _mix(n, L, 'MULTIPLY', 1.0, bsock, SHADOW_TINT_FIT)), _mix(n, L, 'MIX', 0.16, bsock, LIGHT_TINT))
        col = _mix(n, L, 'MIX', _math(n, L, 'MULTIPLY', _rim(n, L), RIM_K), col, RIM_COL)
        col = _grain(n, L, col, GRAIN_K, 320)
        L.new(col, em.inputs['Color'])
    L.new(em.outputs[0], out.inputs['Surface'])

def _decal(n, L, base):
    """The face image (FACE) laid on the head through its 'face' UV map (the head's box seen from the front, u across, v up);
    only the front half ('facefront' u under 0.5) shows it; the image's alpha lays it over the skin."""
    img = bpy.data.images.get('face_' + EYES + '_' + FACE) or bpy.data.images.get('face_dot_neutral')
    uv = n.new('ShaderNodeUVMap'); uv.uv_map = 'face'                       # the head's UV maps (hero2_build face_uvs): the face seen from the front, and the depth
    tex = n.new('ShaderNodeTexImage'); tex.image = img; tex.extension = 'CLIP'; tex.interpolation = 'Linear'; L.new(uv.outputs['UV'], tex.inputs['Vector'])
    uvf = n.new('ShaderNodeUVMap'); uvf.uv_map = 'facefront'; sep = n.new('ShaderNodeSeparateXYZ'); L.new(uvf.outputs['UV'], sep.inputs[0])
    front = _math(n, L, 'LESS_THAN', sep.outputs['X'], 0.5)
    a = _math(n, L, 'MULTIPLY', tex.outputs['Alpha'], front)
    return _mix(n, L, 'MIX', a, base, tex.outputs['Color'])

def _paint_face(name, eyes, expr, size=256):
    """A face as an RGBA image: two dark eyes set a little high, short thick brows, no mouth (the beard covers it). eyes: dot
    (a solid round eye), oval (a small upright oval), highlight (a dot with a tiny light in its upper left). expr: neutral,
    blink (two lines), angry (brows down toward the nose, eyes narrowed), hurt (eyes shut tight, brows up)."""
    import math as _m
    px = [0.0] * (size * size * 4)
    ink = srgb('#2a1a14'); brow = srgb('#6b3418'); hi = (0.95, 0.9, 0.82)
    def put(x, y, col, a=1.0):
        if 0 <= x < size and 0 <= y < size:
            i = (y * size + x) * 4; px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = max(px[i + 3], a)
    def ellipse(cx, cy, rx, ry, col, rot=0.0):
        for y in range(int(cy - ry - rx) - 1, int(cy + ry + rx) + 2):
            for x in range(int(cx - rx - ry) - 1, int(cx + rx + ry) + 2):
                dx, dy = x + 0.5 - cx, y + 0.5 - cy; c, s_ = _m.cos(rot), _m.sin(rot); u, v = dx * c + dy * s_, -dx * s_ + dy * c
                d = (u / rx) ** 2 + (v / ry) ** 2
                if d <= 1: put(x, y, col, 1.0)
                elif d <= 1.35: put(x, y, col, max(0.0, 1 - (d - 1) / 0.35))
    # positions in the head box: u across (0 left .. 1 right), v up (0 chin .. 1 crown); the image's v axis is flipped on write
    ex, ey = 0.19, 0.575; es = size
    for sx in (-1, 1):
        cx, cy = (0.5 + sx * ex) * es, (1 - ey) * es
        if expr == 'blink': ellipse(cx, cy, 0.05 * es, 0.009 * es, ink)
        elif expr == 'hurt': ellipse(cx, cy, 0.045 * es, 0.01 * es, ink, rot=sx * 0.5); ellipse(cx, cy, 0.045 * es, 0.01 * es, ink, rot=-sx * 0.5)
        else:
            if eyes == 'oval': ellipse(cx, cy, 0.03 * es, 0.048 * es, ink)
            else: ellipse(cx, cy, 0.044 * es, 0.044 * es, ink)
            if expr == 'angry': ellipse(cx, cy - 0.03 * es, 0.05 * es, 0.022 * es, (0, 0, 0), rot=0)   # a lid cut from above (made transparent below)
            if eyes == 'highlight' and expr != 'angry': ellipse(cx - 0.012 * es, cy - 0.012 * es, 0.009 * es, 0.009 * es, hi)
        # the brow: a short thick bar; angry slants it down toward the nose, hurt lifts it
        by = cy - (0.085 if expr != 'hurt' else 0.11) * es; rot = 0.0
        if expr == 'angry': rot = -sx * 0.45; by += 0.02 * es
        if expr == 'hurt': rot = sx * 0.3
        ellipse(cx + (0.01 * sx if expr == 'angry' else 0) * es, by, 0.065 * es, 0.018 * es, brow, rot=rot)
    if expr == 'angry':               # the lid: skin-coloured alpha 0 cannot be drawn with put, so punch it: clear the lid region
        for sx in (-1, 1):
            cx, cy = (0.5 + sx * ex) * es, (1 - ey) * es
            for y in range(int(cy - 0.06 * es), int(cy - 0.012 * es)):
                for x in range(int(cx - 0.05 * es), int(cx + 0.05 * es) + 1):
                    if 0 <= x < size and 0 <= y < size: i = (y * size + x) * 4; px[i + 3] = 0.0
    img = bpy.data.images.get(name) or bpy.data.images.new(name, size, size, alpha=True)
    flipped = []
    for row in range(size - 1, -1, -1): flipped.extend(px[row * size * 4:(row + 1) * size * 4])
    img.pixels = flipped; img.alpha_mode = 'STRAIGHT'; img.pack(); img.use_fake_user = True
    return img

def face_images():
    """Every face image the renders can pick: three eye styles by four expressions, packed into the .blend."""
    for eyes in ('dot', 'oval', 'highlight'):
        for expr in ('neutral', 'blink', 'angry', 'hurt'): _paint_face('face_%s_%s' % (eyes, expr), eyes, expr)

def material(name, hexs, pattern=None, style='cel', face=False):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m['hex'] = hexs; m['pattern'] = pattern or ''
    if face: m['face'] = 1
    build_nodes(m, style); m.diffuse_color = (*srgb(hexs), 1)
    return m

def restyle(style):
    for m in bpy.data.materials:
        if 'hex' in m: build_nodes(m, style)

def sun(style='cel'):
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = 1.0 if style == 'painted' else 1.15; d.angle = 0.0
    o = bpy.data.objects.new('Sun', d); bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = SUN_DIR.to_track_quat('-Z', 'Y').to_euler()
    return o

def camera(scene, elev_deg=35, ortho=1.75, aim_z=0.85):
    d = bpy.data.cameras.new('Camera'); d.type = 'ORTHO'; d.ortho_scale = ortho; d.clip_start = 0.1; d.clip_end = 100
    o = bpy.data.objects.new('Camera', d); scene.collection.objects.link(o)
    e = math.radians(elev_deg); dist = 12
    o.location = (0, -dist * math.cos(e), aim_z + dist * math.sin(e)); o.rotation_euler = (math.pi / 2 - e, 0, 0)
    scene.camera = o
    return o

def world(scene, ambient=None, style='cel'):
    if ambient is None: ambient = 0.14 if style == 'painted' else 0.10
    w = bpy.data.worlds.get('World') or bpy.data.worlds.new('World'); scene.world = w; w.use_nodes = True
    air = SCENES[SCENE]['air']; k = ambient / 0.10
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (air[0] * k, air[1] * k, air[2] * k, 1); bg.inputs[1].default_value = 1.0   # the scene's air

def freestyle(scene, view_layer, px, collection=None, style='cel'):
    """The line per style: cel, a whole-silhouette contour heavy toward the lower right and a thinner line at overlaps;
    painted, thin, brown, a little transparent and wobbling; folk, bold and even."""
    r = scene.render; r.use_freestyle = True; r.line_thickness_mode = 'ABSOLUTE'; r.line_thickness = 1.0
    view_layer.use_freestyle = True
    fs = view_layer.freestyle_settings; fs.crease_angle = math.radians(100); fs.as_render_pass = False
    for ls in list(fs.linesets): fs.linesets.remove(ls)
    cfg = {'cel': ('#231a16', 1.0, 1.9, 0.9, True, 0), 'painted': ('#33231a', 1.0, 1.5, 0.9, False, 1.2), 'folk': ('#1e1612', 1.0, 2.4, 1.6, False, 0)}[style]
    ink, alpha, heavy, thin, calligraphy, wobble = cfg
    def lineset(name, thick, outer):
        ls = fs.linesets.new(name)
        ls.select_silhouette = not outer; ls.select_border = not outer; ls.select_crease = not outer
        ls.select_external_contour = outer; ls.select_contour = False; ls.select_by_visibility = True; ls.visibility = 'VISIBLE'
        if collection is not None: ls.select_by_collection = True; ls.collection = collection
        st = ls.linestyle; st.color = srgb(ink); st.thickness = thick * px; st.alpha = alpha; st.caps = 'ROUND'; st.use_chaining = True; st.chaining = 'PLAIN'
        if wobble:
            gm = st.geometry_modifiers.new('wobble', 'PERLIN_NOISE_1D'); gm.amplitude = wobble * px; gm.frequency = 6.0; gm.octaves = 2
        return st
    st = lineset('contour', heavy, True)
    if calligraphy:
        cal = st.thickness_modifiers.new('calligraphy', 'CALLIGRAPHY'); cal.orientation = math.radians(45); cal.thickness_min = heavy * 0.5 * px; cal.thickness_max = heavy * 1.3 * px
    lineset('inner', thin, False)
    return fs

def setup_render(scene, size, px, samples=16):
    r = scene.render; r.engine = 'BLENDER_EEVEE'; r.resolution_x = r.resolution_y = size * px; r.resolution_percentage = 100
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.image_settings.color_depth = '8'
    r.filter_size = 1.2
    scene.eevee.taa_render_samples = samples
    scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
    scene.display_settings.display_device = 'sRGB'
