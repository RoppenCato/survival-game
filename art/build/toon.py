"""The shared look for everything rendered from Blender (2026-10-09): the toon material in the art direction (a base tone,
a cool shadow side, a small warm light, grain in every fill), the sun upper left, the orthographic three-quarter camera
and the Freestyle ink line (one warm brown-black contour round the whole silhouette, heavy toward the lower right, a
thinner line at real overlaps). Imported by the build and render scripts (they add this folder to sys.path)."""
import bpy, math
from mathutils import Vector

INK_HEX = '#231a16'                  # the warm brown-black ink (srgb() turns it linear for the line style)
SHADOW_TINT = (0.60, 0.66, 0.86)     # the shadow side is cooler and bluer, never the same hue darkened
LIGHT_TINT = (1.0, 0.95, 0.80)       # the small warm highlight
GRAIN = 0.045                        # paper and pencil through every fill

def srgb(hexs):
    """'#rrggbb' to linear rgb, which is what the node sockets take."""
    h = hexs.lstrip('#'); v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in v)

def _sock(node, name, kind, outputs=False):
    for s in (node.outputs if outputs else node.inputs):
        if s.name == name and s.type == kind: return s
    raise KeyError(name + ' ' + kind)

def toon_group():
    """A node group 'Toon': Base Color in, a shader out. Diffuse light is read back (Shader to RGB), cut into shadow,
    base and light with two thresholds, the shadow mixed toward the cool tint, the light toward the warm one, grain added."""
    g = bpy.data.node_groups.get('Toon')
    if g: return g
    g = bpy.data.node_groups.new('Toon', 'ShaderNodeTree')
    g.interface.new_socket('Base Color', in_out='INPUT', socket_type='NodeSocketColor')
    g.interface.new_socket('Shader', in_out='OUTPUT', socket_type='NodeSocketShader')
    n, L = g.nodes, g.links
    gi = n.new('NodeGroupInput'); go = n.new('NodeGroupOutput')
    dif = n.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
    rgb = n.new('ShaderNodeShaderToRGB'); L.new(dif.outputs[0], rgb.inputs[0])
    val = n.new('ShaderNodeRGBToBW'); L.new(rgb.outputs['Color'], val.inputs['Color'])
    dark = n.new('ShaderNodeMath'); dark.operation = 'LESS_THAN'; dark.inputs[1].default_value = 0.66
    lit = n.new('ShaderNodeMath'); lit.operation = 'GREATER_THAN'; lit.inputs[1].default_value = 0.9
    L.new(val.outputs[0], dark.inputs[0]); L.new(val.outputs[0], lit.inputs[0])
    # the shadow colour: base * tint
    sh = n.new('ShaderNodeMix'); sh.data_type = 'RGBA'; sh.blend_type = 'MULTIPLY'; sh.inputs['Factor'].default_value = 1.0
    _sock(sh, 'B', 'RGBA').default_value = (*SHADOW_TINT, 1)
    L.new(gi.outputs['Base Color'], _sock(sh, 'A', 'RGBA'))
    # the light colour: base toward the warm tint
    lt = n.new('ShaderNodeMix'); lt.data_type = 'RGBA'; lt.blend_type = 'MIX'; lt.inputs['Factor'].default_value = 0.22
    _sock(lt, 'B', 'RGBA').default_value = (*LIGHT_TINT, 1)
    L.new(gi.outputs['Base Color'], _sock(lt, 'A', 'RGBA'))
    # pick: base, then shadow where dark, then light where lit
    m1 = n.new('ShaderNodeMix'); m1.data_type = 'RGBA'
    L.new(dark.outputs[0], m1.inputs['Factor']); L.new(gi.outputs['Base Color'], _sock(m1, 'A', 'RGBA')); L.new(_sock(sh, 'Result', 'RGBA', True), _sock(m1, 'B', 'RGBA'))
    m2 = n.new('ShaderNodeMix'); m2.data_type = 'RGBA'
    L.new(lit.outputs[0], m2.inputs['Factor']); L.new(_sock(m1, 'Result', 'RGBA', True), _sock(m2, 'A', 'RGBA')); L.new(_sock(lt, 'Result', 'RGBA', True), _sock(m2, 'B', 'RGBA'))
    # grain: a fine noise, centred on zero, added at low strength
    tc = n.new('ShaderNodeTexCoord'); nz = n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 140; nz.inputs['Detail'].default_value = 1.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    gsub = n.new('ShaderNodeMath'); gsub.operation = 'SUBTRACT'; gsub.inputs[1].default_value = 0.5; L.new(nz.outputs['Fac'], gsub.inputs[0])
    gmul = n.new('ShaderNodeMath'); gmul.operation = 'MULTIPLY'; gmul.inputs[1].default_value = GRAIN; L.new(gsub.outputs[0], gmul.inputs[0])
    gadd = n.new('ShaderNodeMix'); gadd.data_type = 'RGBA'; gadd.blend_type = 'ADD'; gadd.inputs['Factor'].default_value = 1.0
    L.new(_sock(m2, 'Result', 'RGBA', True), _sock(gadd, 'A', 'RGBA'))
    g2c = n.new('ShaderNodeCombineColor'); L.new(gmul.outputs[0], g2c.inputs[0]); L.new(gmul.outputs[0], g2c.inputs[1]); L.new(gmul.outputs[0], g2c.inputs[2])
    L.new(g2c.outputs[0], _sock(gadd, 'B', 'RGBA'))
    em = n.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
    L.new(_sock(gadd, 'Result', 'RGBA', True), em.inputs['Color']); L.new(em.outputs[0], go.inputs['Shader'])
    return g

def material(name, hexs):
    """A toon material in one colour."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    n = m.node_tree.nodes; n.clear()
    grp = n.new('ShaderNodeGroup'); grp.node_tree = toon_group()
    col = srgb(hexs); grp.inputs['Base Color'].default_value = (*col, 1)
    out = n.new('ShaderNodeOutputMaterial'); m.node_tree.links.new(grp.outputs['Shader'], out.inputs['Surface'])
    m.diffuse_color = (*col, 1)
    return m

def sun():
    """One sun, upper left of the camera (the camera looks along +Y), from in front and above."""
    d = bpy.data.lights.new('Sun', 'SUN'); d.energy = 1.15; d.angle = 0.0
    o = bpy.data.objects.new('Sun', d); bpy.context.scene.collection.objects.link(o)
    travel = Vector((0.55, 0.45, -0.70)).normalized()                # the light travels down, to the right and away
    o.rotation_euler = travel.to_track_quat('-Z', 'Y').to_euler()
    return o

def camera(scene, elev_deg=35, ortho=1.75, aim_z=0.85):
    """Orthographic, looking north (along +Y) from the south, elev_deg above the ground; ortho is the frame width in metres."""
    d = bpy.data.cameras.new('Camera'); d.type = 'ORTHO'; d.ortho_scale = ortho; d.clip_start = 0.1; d.clip_end = 100
    o = bpy.data.objects.new('Camera', d); scene.collection.objects.link(o)
    e = math.radians(elev_deg); dist = 12
    o.location = (0, -dist * math.cos(e), aim_z + dist * math.sin(e))
    o.rotation_euler = (math.pi / 2 - e, 0, 0)
    scene.camera = o
    return o

def world(scene, ambient=0.10):
    w = bpy.data.worlds.get('World') or bpy.data.worlds.new('World'); scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (ambient, ambient, ambient, 1); bg.inputs[1].default_value = 1.0

def freestyle(scene, view_layer, px, collection=None, heavy=1.9, thin=0.9):
    """The ink line, at a render px scale (2 means rendering at double size): the whole-silhouette contour heavy toward the
    lower right (a calligraphy thickness), and a thinner line at silhouettes inside it (real overlaps) and creases."""
    r = scene.render; r.use_freestyle = True; r.line_thickness_mode = 'ABSOLUTE'; r.line_thickness = 1.0
    view_layer.use_freestyle = True
    fs = view_layer.freestyle_settings; fs.crease_angle = math.radians(120); fs.as_render_pass = False
    for ls in list(fs.linesets): fs.linesets.remove(ls)
    def lineset(name, thick, outer):
        ls = fs.linesets.new(name)
        ls.select_silhouette = not outer; ls.select_border = not outer; ls.select_crease = not outer
        ls.select_external_contour = outer; ls.select_contour = False
        ls.select_by_visibility = True; ls.visibility = 'VISIBLE'
        if collection is not None:
            ls.select_by_collection = True; ls.collection = collection
        st = ls.linestyle; st.color = srgb(INK_HEX); st.thickness = thick * px; st.alpha = 1.0
        st.caps = 'ROUND'; st.use_chaining = True; st.chaining = 'PLAIN'
        return ls, st
    ls, st = lineset('contour', heavy, True)
    cal = st.thickness_modifiers.new('calligraphy', 'CALLIGRAPHY')
    cal.orientation = math.radians(45); cal.thickness_min = heavy * 0.5 * px; cal.thickness_max = heavy * 1.3 * px
    lineset('inner', thin, False)
    return fs

def setup_render(scene, size, px, samples=16):
    r = scene.render; r.engine = 'BLENDER_EEVEE'; r.resolution_x = r.resolution_y = size * px; r.resolution_percentage = 100
    r.film_transparent = True; r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'; r.image_settings.color_depth = '8'
    r.filter_size = 1.2
    scene.eevee.taa_render_samples = samples
    scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
    scene.display_settings.display_device = 'sRGB'
