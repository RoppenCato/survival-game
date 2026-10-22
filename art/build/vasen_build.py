"""The redesigned väsen and the troll mother, built for the game (2026-10-14; Robin's directions on the concept board): bodies
sculpted from a radius-skeleton (skin.py), rigged and posed by their joints (figure.py), clips baked from functions of the
phase.   node tools/blender.js vasen_build.py -- <huldra|nacken|draugr|troll_mor>

  huldra     her body is the dead hollow oak: a bark trunk to the ground with its hollow open at the back, the red dress
             covering the front and sides to the ground (no feet) and mouldered away down the back; fair arms, head and hair.
             Clips: idle (a sway, a slow beckon), walk (a glide), call, hit, death (she falls back like a felled tree)
  nacken     seated on his stone with the lyre, the leg clear of the rock. Clips: play (plucking, swaying, nodding, a tapping
             foot), idle (looking up at you), hit, death (he slumps over the lyre). No walk: he never leaves the stone.
  draugr     the drowned warrior, and visibly drowned: a net tangled over him, kelp, barnacles and mussels, a crab on the
             shoulder, the rope and stone that sank him dragging behind, water dripping, rust streaks, weed on the notched
             blade, rings on the mail. Clips: idle (sway, loll, a jerk of the head), walk (a lurch, one leg dragging), windup
             (the sword raised slowly overhead), attack (the hew), hit, shield (cowering from the light), death
  troll_mor  Trollmor: vast, stooped, the mane to the ground, hide skirt and apron, beads, the long nose, a staff in one hand
             and the basket with a troll child on the other hip. Clips: idle, walk (a shuffle), windup (the staff raised
             overhead), attack (the blow), hit, shield (she hides her face), death (she sinks and topples)"""
import bpy, math, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
toon.TONES = 'chosen'                                   # the kraken round (2026-10-22; Robin: keep the old trolls, updated)
from skin import Stick, loft, ball, cap, head as head_obj, poly_blade
from figure import Figure, R3, RX, RY, RZ, ease, ik2
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
KIND = argv[0] if argv else 'huldra'
SRC = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')); OUT = os.path.join(SRC, KIND + '.blend')
rad = math.radians; TAU = 2 * math.pi; FPS = 24; RNG = random.Random(11)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
coll = bpy.data.collections.new('Body'); sc.collection.children.link(coll); gear = bpy.data.collections.new('Gear'); sc.collection.children.link(gear)
C = {}; BIND = []
def mats(d, face_kind=None, face_hex=None, patterns=None, wet=()):
    for k, v in d.items(): C[k] = toon.material('c_' + k, v, (patterns or {}).get(k), 'cel', wet=k in wet)
    if face_kind: toon.face_images(face_kind); C['face'] = toon.material('c_face', face_hex, None, 'cel', face=True, wet='face' in wet)
def water_surface():
    """A holdout plane at the ground (2026-10-14, Näcken): whatever goes below it is cut from the picture, so a figure slipping
    under the water vanishes under the surface the game draws, and nothing below the ground ever shows."""
    m = bpy.data.materials.new('_water'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); h = nt.nodes.new('ShaderNodeHoldout'); nt.links.new(h.outputs[0], out.inputs[0])
    me = bpy.data.meshes.new('water'); me.from_pydata([(-20, -20, -0.002), (20, -20, -0.002), (20, 20, -0.002), (-20, 20, -0.002)], [], [(0, 1, 2, 3)]); me.materials.append(m)
    o = bpy.data.objects.new('water', me); coll.objects.link(o); return o
def use(o, bones=None, blend=0.06): BIND.append((o, bones, blend)); return o
def hang(name, pts, length, r0, r1, mat, lean=0.0, sway=0.0, seg=3, bones=None, blend=0.1):
    S = Stick()
    for k, p in enumerate(pts):
        p = Vector(p); o = Vector((p.x, p.y, 0)); o = o.normalized() * lean if o.length > 0.01 else Vector()
        S.chain([p + (o + Vector((0, 0, -length))) * (j / seg) + Vector((sway * math.sin(j * 1.3 + k), sway * math.cos(j * 0.9 + k), 0)) * (j > 0) for j in range(seg + 1)], (r0, r1), None, mat)
    return use(S.build(name, coll, C, subdiv=1), bones, blend)
def sn(p, f=1.0, o=0.0): return math.sin(TAU * (p * f + o))
F = Figure(KIND); J0 = F.joint

# ---- posing helpers (after the rig is built, R0 holds the rest joints)
def base(): return {k: v.copy() for k, v in F.R0.items()}
def torso(J, hips=None, yaw=0.0, pitch=0.0, roll=0.0, names=('chest', 'neck', 'headb', 'headt', 'shL', 'shR', 'hipL', 'hipR')):
    R = R3(yaw, pitch, roll); J['hips'] = Vector(hips) if hips is not None else F.R0['hips'].copy()
    for n in names:
        if n in F.R0: J[n] = J['hips'] + R @ (F.R0[n] - F.R0['hips'])
    return R
def headpose(J, R, pitch=0.0, yaw=0.0, roll=0.0): J['headt'] = J['headb'] + (R @ R3(yaw, pitch, roll)) @ (F.R0['headt'] - F.R0['headb'])
def arm(J, s, wrist, bend=(0, -1, 0), tip=None):
    R0 = F.R0; sh = J['sh' + s]; l1 = (R0['el' + s] - R0['sh' + s]).length; l2 = (R0['wr' + s] - R0['el' + s]).length; l3 = (R0['ha' + s] - R0['wr' + s]).length
    el, wr = ik2(sh, wrist, l1, l2, bend); J['el' + s] = el; J['wr' + s] = wr
    d = Vector(tip) if tip is not None else (wr - el); J['ha' + s] = wr + d.normalized() * l3
def leg(J, s, ankle, toe=(0, -1, -0.35), bend=(0, -1, 0)):
    R0 = F.R0; hip = J['hip' + s]; l1 = (R0['kn' + s] - R0['hip' + s]).length; l2 = (R0['an' + s] - R0['kn' + s]).length; l3 = (R0['to' + s] - R0['an' + s]).length
    kn, an = ik2(hip, ankle, l1, l2, bend); J['kn' + s] = kn; J['an' + s] = an; J['to' + s] = an + Vector(toe).normalized() * l3
def rotate_all(J, pivot, R):
    pivot = Vector(pivot)
    for k in J: J[k] = pivot + R @ (J[k] - pivot)
def T(J, R, p): return J['hips'] + R @ (Vector(p) - F.R0['hips'])     # a rest point carried with the torso
def step(s, u, S, h, beta, y0, z0, x):
    """a foot through a walk: planted and sliding back through the stance, lifted and carried forward through the swing"""
    u = u % 1.0
    if u < beta: return Vector((x, y0 - S / 2 + S * (u / beta), z0))
    v = (u - beta) / (1 - beta); e = 0.5 - 0.5 * math.cos(math.pi * v); return Vector((x, y0 + S / 2 - S * e, z0 + h * math.sin(math.pi * v)))

# ================================================================= the huldra
def build_huldra():
    mats({'skin': '#f0d8c2', 'dress': '#b03a2e', 'trim': '#d6b05a', 'hair': '#e6d08a', 'bark': '#6e5440', 'rot': '#1e1612', 'fungus': '#e3d2a8', 'moss': '#7f9e4e', 'rotmoss': '#5a7438', 'flower': '#f3efe0'}, 'huldra', '#f0d8c2')
    for n, p in (('hips', (0, 0, 1.0)), ('chest', (0, 0, 1.34)), ('neck', (0, 0, 1.47)), ('headb', (0, 0, 1.56)), ('headt', (0, 0, 1.78)), ('base', (0, 0, 0.02))): J0(n, p)
    for s, sx in (('L', 1), ('R', -1)):
        J0('sh' + s, (sx * 0.17, 0, 1.43)); J0('el' + s, (sx * 0.31, 0, 1.21)); J0('wr' + s, (sx * 0.34, -0.06, 1.02)); J0('ha' + s, (sx * 0.34, -0.11, 0.96))
    F.bone('hips', 'hips', 'chest'); F.bone('chest', 'chest', 'neck', 'hips'); F.bone('neck', 'neck', 'headb', 'chest'); F.bone('head', 'headb', 'headt', 'neck'); F.bone('trunk', 'hips', 'base')
    for s, sx in (('L', 1), ('R', -1)):
        F.bone('up' + s, 'sh' + s, 'el' + s, 'chest', (sx, 0, 0)); F.bone('lo' + s, 'el' + s, 'wr' + s, 'up' + s, (sx, 0, 0)); F.bone('ha' + s, 'wr' + s, 'ha' + s, 'lo' + s, (sx, 0, 0))
    S = Stick(); c = S.add((0, 0, 1.38), (0.13, 0.10), mat='dress'); c2 = S.add((0, 0, 1.46), (0.10, 0.08), c, 'dress'); nk = S.add((0, 0, 1.50), 0.045, c2, 'skin'); S.add((0, 0, 1.56), 0.042, nk, 'skin')   # the dress to the collarbone: a short neck, not a bib
    for s, sx in (('L', 1), ('R', -1)):
        sh = S.add(F.J['sh' + s], (0.058, 0.05), c, 'dress'); el = S.add(F.J['el' + s], 0.042, sh, 'dress'); wr = S.add(F.J['wr' + s], (0.036, 0.03), el, 'skin'); ha = S.add(F.J['ha' + s], (0.04, 0.025), wr, 'skin')
        for dx, dz in ((-0.035, 0.02), (-0.012, 0.0), (0.012, -0.01), (0.036, -0.025)): S.chain([(sx * (0.34 + dx * 0.6), -0.15, 0.955 + dz), (sx * (0.34 + dx), -0.20, 0.95 + dz * 1.5)], (0.011, 0.007), ha, 'skin')
    use(S.build('body', coll, C))
    # the trunk: bark open at the back, the rot inside, a ragged rim, fungus, roots
    rings = [((0, 0, 0.0), 0.30, 0.25), ((0, 0, 0.22), 0.27, 0.225), ((0, 0, 0.5), 0.24, 0.20), ((0.01, 0, 1.0), 0.15, 0.125), ((0.01, 0, 1.16), 0.105, 0.088), ((0.01, 0, 1.34), 0.11, 0.09), ((0.01, 0, 1.44), 0.10, 0.08)]   # inside the dress at the waist (it poked through)
    gap = [0.0, 0.3, 0.75, 0.95, 0.9, 0.85, 0.5]; arc = lambda k: (math.pi / 2 + gap[k], math.pi / 2 - gap[k] + TAU)   # whole at the foot (2026-10-14: the roots grew from nothing where the back was open), the hollow opening above the knee
    edge = lambda k, i, n: 1 + (0.07 * math.sin(k * 2.3 + i * 1.7) if i in (0, n - 1) and gap[k] > 0 else 0)
    use(loft('bark', coll, C['bark'], rings, seg=22, arc=arc, edge=edge, closed=False), ['trunk'])
    use(loft('rot', coll, C['rot'], [((c_[0], c_[1], c_[2] + 0.005), rx * 0.86, ry * 0.86) for (c_, rx, ry) in rings], seg=22, arc=lambda k: (math.pi / 2 + max(gap[k], 0.02) * 0.98, math.pi / 2 - max(gap[k], 0.02) * 0.98 + TAU), closed=False, flip=True), ['trunk'])
    for i in range(10): a = math.pi / 2 + (i - 4.5) * 0.19; hang('rim%d' % i, [(math.cos(a) * 0.2, math.sin(a) * 0.17, 1.2 + 0.12 * math.sin(i * 1.7))], 0.06 + 0.04 * (i % 3), 0.02, 0.004, 'bark', lean=0.02, bones=['trunk'])   # (hang binds; bound twice, they flew off in the fall)
    for (x, y, z, r) in ((0.18, 0.08, 1.05, 0.05), (-0.19, 0.06, 0.78, 0.06), (0.21, 0.1, 0.52, 0.05), (-0.24, 0.08, 0.3, 0.05)): use(ball('fungus', coll, C['fungus'], (x, y, z), r, 0.9, 0.9, 0.35), ['trunk'])
    use(ball('moss', coll, C['moss'], (-0.1, 0.12, 1.36), 0.06, 1.0, 0.5, 0.6), ['trunk'])
    # rot-green moss on the hollow's rim and a little inside it (Robin, 2026-10-14: some, not too much)
    for (x, y, z, r, sy) in ((0.15, 0.16, 0.98, 0.045, 0.5), (-0.17, 0.14, 0.70, 0.05, 0.5), (0.05, 0.19, 0.48, 0.04, 0.5), (-0.08, 0.17, 1.22, 0.035, 0.5)): use(ball('rimmoss', coll, C['rotmoss'], (x, y, z), r, 1.0, sy, 0.6), ['trunk'])
    for (x, y, z, r) in ((-0.06, 0.12, 0.86, 0.035), (0.08, 0.1, 0.62, 0.03)): use(ball('inmoss', coll, C['rotmoss'], (x, y, z), r, 1.0, 0.5, 0.8), ['trunk'])
    Sr = Stick()                                     # roots: out of the bark at the foot and down to the ground behind and beside her (the front and sides are under the dress)
    for ang, L_ in ((rad(55), 0.26), (rad(90), 0.36), (rad(125), 0.28), (rad(160), 0.2), (rad(20), 0.2)):
        x0, y0 = math.cos(ang) * 0.26, math.sin(ang) * 0.22; x1, y1 = math.cos(ang) * (0.3 + L_), math.sin(ang) * (0.25 + L_)
        Sr.chain([(x0, y0, 0.14), (x0 * 1.2, y0 * 1.2, 0.07), (x1, y1, 0.0)], [0.085, 0.06, 0.018], None, 'bark')
    use(Sr.build('roots', coll, C, subdiv=1), ['trunk'])
    # the dress: a strip to the ground, folds growing toward the hem, mouldered away down the back
    drings = [((0, 0, 1.47), 0.12, 0.09), ((0, 0, 1.42), 0.16, 0.12), ((0, 0, 1.30), 0.15, 0.12), ((0, 0, 1.16), 0.135, 0.105), ((0.01, 0, 1.0), 0.17, 0.145), ((0.01, -0.01, 0.70), 0.235, 0.195), ((0.01, -0.02, 0.40), 0.31, 0.26), ((0.01, -0.03, 0.12), 0.39, 0.33), ((0.01, -0.03, 0.02), 0.41, 0.35)]
    dgap = [0.3, 0.35, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2, 1.3]; darc = lambda k: (math.pi / 2 + dgap[k], math.pi / 2 - dgap[k] + TAU)
    use(loft('dress', coll, C, drings, seg=28, ring_mat=['dress'] * 7 + ['trim', 'trim'], arc=darc, closed=False, wave=lambda k, a: 1 + 0.05 * math.sin(6 * a + 0.4) * (k / 8) ** 1.5 + (0.03 * math.sin(11 * a) if k == 8 else 0), edge=lambda k, i, n: 1 + (0.06 * math.sin(k * 3.1 + i * 0.7) if i in (0, n - 1) else 0)), ['hips', 'chest', 'trunk'], 0.12)
    use(loft('belt', coll, C['trim'], [((0.0, 0.0, 1.13), 0.13, 0.105), ((0.0, 0.0, 1.17), 0.127, 0.102)], seg=20), ['hips'])
    use(loft('neckline', coll, C['trim'], [((0, 0, 1.455), 0.125, 0.095), ((0, 0, 1.485), 0.095, 0.072)], seg=20), ['chest'])
    use(head_obj('head', coll, C['face'], (0, 0, 1.665), 0.125), ['head'])                                                        # a little bigger than life, so the face reads at game scale
    use(cap('haircap', coll, C['hair'], (0.0, 0.015, 1.69), 0.146, (0, -0.085, 1.72), (0, 0.55, 1), 0.96, 1.0, 1.0), ['head'])        # the hair leaves the face clear (a full ball fought the face for the front of the head)
    for i, (fx, fl) in enumerate(((-0.09, 0.04), (-0.032, 0.055), (0.037, 0.05), (0.09, 0.035))):                                 # a soft fringe
        Sf = Stick(); Sf.chain([(fx, -0.095, 1.76), (fx * 1.15, -0.118, 1.76 - fl)], (0.022, 0.006), None, 'hair'); use(Sf.build('fringe%d' % i, coll, C, subdiv=1), ['head'])
    for sx in (1, -1):
        Sp = Stick(); Sp.chain([(sx * 0.12, -0.02, 1.62), (sx * 0.17, -0.10, 1.42), (sx * 0.165, -0.125, 1.15), (sx * 0.15, -0.10, 0.90)], (0.058, 0.032), None, 'hair'); use(Sp.build('rope' + str(sx), coll, C), ['head', 'chest'], 0.12)
    Sb = Stick(); Sb.chain([(0.0, 0.10, 1.62), (0.0, 0.17, 1.35), (0.0, 0.19, 1.08)], (0.105, 0.05), None, 'hair'); use(Sb.build('backhair', coll, C), ['head', 'chest'], 0.12)
    for i in range(7): a = rad(i * 51 + 30); use(ball('flower', coll, C['flower'], (math.cos(a) * 0.075, 0.015 + math.sin(a) * 0.08, 1.815), 0.018, 1, 1, 0.6), ['head'])   # a small wreath on the crown (at the hairline two of them read as eyes)
    F.build_rig(sc); bind_all()
    R0 = F.R0
    def stance(J, R, beckon=0.0, hip=1.0):
        arm(J, 'R', T(J, R, (-0.17, -0.07, 1.02)) if hip else T(J, R, R0['wrR']), bend=(-1, 0.3, 0), tip=(0.6, -0.5, -0.2))
        arm(J, 'L', T(J, R, (0.30, -0.18, 1.10)) + Vector((-0.06, -0.12, 0.26)) * beckon, bend=(1, -0.2, 0), tip=(-0.2, -0.6, 0.5 + 0.6 * beckon))
    def idle(p):
        J = base(); R = torso(J, yaw=3 * sn(p, 0.5), pitch=1 + 1.5 * sn(p), roll=2 * sn(p)); headpose(J, R, 3 + 2 * sn(p, 1, 0.2), 10 * sn(p, 0.5, 0.3), 6 * sn(p))
        stance(J, R, beckon=0.25 + 0.2 * sn(p, 1, 0.6)); return J
    def walk(p):
        J = base(); R = torso(J, pitch=4 + 1.5 * sn(p, 2), roll=3 * sn(p, 1, 0.1)); headpose(J, R, 2, 4 * sn(p), 3 * sn(p, 1, 0.3)); stance(J, R, beckon=0.2); return J
    def call(p):
        k = ease(min(1.0, p * 3)) * ease(min(1.0, (1 - p) * 3)); w = sn(p, 3)
        J = base(); R = torso(J, yaw=-4 * k, pitch=6 * k, roll=-3 * k); headpose(J, R, -4 * k, -10 * k, 10 * k)
        arm(J, 'R', T(J, R, (-0.17, -0.07, 1.02)), bend=(-1, 0.3, 0), tip=(0.6, -0.5, -0.2))
        arm(J, 'L', T(J, R, (0.22, -0.34, 1.40)) + Vector((0, 0.06 * w * k, 0.03 * w * k)), bend=(1, 0, 0.3), tip=(-0.3, 0.6 * k - 0.4 * (1 - k), 0.5)); return J
    def hit(p):
        k = math.sin(math.pi * p); J = base(); R = torso(J, yaw=12 * k, pitch=-9 * k, roll=4 * k); headpose(J, R, -8 * k, 16 * k, 8 * k)
        arm(J, 'R', T(J, R, (-0.26, -0.16, 1.14)), bend=(-1, 0, 0)); arm(J, 'L', T(J, R, (0.30, -0.22, 1.22)), bend=(1, 0, 0)); return J
    def death(p):
        f = ease(min(1.0, p / 0.62)); st = math.sin(math.pi * min(1.0, p / 0.3)) * (1 - min(1.0, p / 0.4)); settle = 0.03 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.75) / 0.25)))
        J = base(); R = torso(J, pitch=-6 * st, roll=6 * st); headpose(J, R, -10 * f, 0, 20 * f)
        arm(J, 'R', T(J, R, (-0.36, -0.08, 1.30)) , bend=(-1, 0, 0.5)); arm(J, 'L', T(J, R, (0.38, -0.06, 1.34)), bend=(1, 0, 0.5))
        rotate_all(J, (0, 0.26, 0.0), RX(-80 * f + 2 * settle * 20)); return J     # about the roots, so they stay near the ground
    F.clip('idle', 48, idle); F.clip('walk', 32, walk); F.clip('call', 40, call); F.clip('hit', 10, hit); F.clip('death', 32, death)

# ================================================================= Näcken
def build_nacken():
    mats({'skin': '#d6e0d4', 'hair': '#1c2624', 'weed': '#4b6d46', 'wood': '#9c7448', 'string': '#eee8d4', 'rock': '#8a8a82', 'rockwet': '#636c70', 'moss': '#7f9e4e', 'reed': '#6f8f46', 'reedhead': '#6b5438', 'pebble': '#9a958a', 'lily': '#f3f0e4', 'lilyc': '#e8c25a'}, 'nacken', '#d6e0d4')
    P = {'hips': (0, 0.06, 0.57), 'chest': (0, -0.04, 0.92), 'neck': (0, -0.08, 1.06), 'headb': (0, -0.11, 1.13), 'headt': (0, -0.15, 1.32), 'shL': (0.17, -0.05, 0.99), 'shR': (-0.17, -0.05, 0.99),
         'elL': (0.28, -0.18, 0.84), 'wrL': (0.15, -0.36, 0.80), 'haL': (0.10, -0.42, 0.80), 'elR': (-0.26, -0.14, 0.82), 'wrR': (-0.09, -0.33, 0.86), 'haR': (-0.04, -0.39, 0.86),
         'hipL': (0.10, 0.05, 0.55), 'knL': (0.15, -0.30, 0.50), 'anL': (0.19, -0.46, 0.10), 'toL': (0.20, -0.57, 0.03), 'hipR': (-0.10, 0.05, 0.55), 'knR': (-0.15, -0.30, 0.66), 'anR': (-0.13, -0.27, 0.14), 'toR': (-0.13, -0.39, 0.04)}
    for n, p in P.items(): J0(n, p)
    F.bone('hips', 'hips', 'chest'); F.bone('chest', 'chest', 'neck', 'hips'); F.bone('neck', 'neck', 'headb', 'chest'); F.bone('head', 'headb', 'headt', 'neck')
    for s, sx in (('L', 1), ('R', -1)):
        F.bone('up' + s, 'sh' + s, 'el' + s, 'chest', (sx, 0, 0)); F.bone('lo' + s, 'el' + s, 'wr' + s, 'up' + s, (sx, 0, 0)); F.bone('ha' + s, 'wr' + s, 'ha' + s, 'lo' + s, (sx, 0, 0))
        F.bone('th' + s, 'hip' + s, 'kn' + s, 'hips', (sx, 0, 0)); F.bone('sh' + s, 'kn' + s, 'an' + s, 'th' + s, (sx, 0, 0)); F.bone('ft' + s, 'an' + s, 'to' + s, 'sh' + s, (sx, 0, 0))
    # the stone (2026-10-14, Robin: he must sit nicely beside a river; he lures you to the water and is gone when you come near):
    # a low slab, long along the bank, dark and wet round its foot, reeds at its back corners, pebbles at its front; the water
    # surface is a holdout at the ground, so when he slips off the back of the stone he goes under and is gone
    F.attach(ball('rock', coll, C['rock'], (0.0, 0.28, 0.14), 0.60, 1.35, 1.0, 0.52)); F.attach(ball('rockwet', coll, C['rockwet'], (0.0, 0.28, 0.02), 0.60, 1.37, 1.02, 0.14))
    F.attach(ball('rockmoss', coll, C['moss'], (0.42, 0.5, 0.37), 0.16, 1, 1, 0.35)); F.attach(ball('rockmoss2', coll, C['moss'], (-0.5, 0.2, 0.33), 0.11, 1, 1, 0.35))
    for (x, y, r) in ((0.55, -0.36, 0.06), (-0.62, -0.30, 0.05), (0.2, -0.42, 0.04), (-0.3, -0.45, 0.045)): F.attach(ball('pebble', coll, C['pebble'], (x, y, r * 0.5), r, 1.2, 1.0, 0.55))
    Rd = Stick()
    for (x, y, h, lean) in ((0.72, 0.62, 0.95, 0.06), (0.80, 0.52, 0.8, -0.05), (0.66, 0.72, 0.7, 0.1), (-0.78, 0.58, 0.9, -0.06), (-0.70, 0.70, 0.75, 0.05), (-0.86, 0.48, 0.65, -0.1)):
        Rd.chain([(x, y, 0.0), (x + lean * 0.5, y + 0.02, h * 0.6), (x + lean, y + 0.04, h)], [0.016, 0.013, 0.008], None, 'reed'); Rd.chain([(x + lean, y + 0.04, h), (x + lean * 1.1, y + 0.05, h + 0.11)], (0.02, 0.014), None, 'reedhead')
    F.attach(Rd.build('reeds', coll, C, subdiv=1)); F.attach(water_surface())
    S = Stick(); j = F.J
    hips = S.add(j['hips'], (0.11, 0.09)); waist = S.add((0, 0.0, 0.74), 0.08, hips); chest = S.add(j['chest'], (0.105, 0.08), waist); neck = S.add(j['neck'], 0.04, chest); S.add((0, -0.10, 1.12), 0.04, neck)
    for s in ('L', 'R'):
        sh = S.add(j['sh' + s], 0.05, chest); el = S.add(j['el' + s], 0.04, sh); wr = S.add(j['wr' + s], 0.032, el); ha = S.add(j['ha' + s], (0.035, 0.022), wr)
        d = (j['ha' + s] - j['wr' + s]).normalized(); side = Vector((1, 0, 0))
        for k in range(4): b = j['ha' + s] + side * ((k - 1.5) * 0.02); S.chain([b + d * 0.03 + Vector((0, 0, -0.01 * k)), b + d * 0.09 + Vector((0, 0, -0.03 * k))], (0.009, 0.006), ha)
        hip = S.add(j['hip' + s], 0.075, hips); kn = S.add(j['kn' + s], 0.06, hip); an = S.add(j['an' + s], 0.04, kn); to = S.add(j['to' + s], (0.035, 0.05), an)
        for k, dx in enumerate((-0.025, 0.0, 0.025)): S.chain([j['to' + s] + Vector((dx, -0.03, 0)), j['to' + s] + Vector((dx * 1.4, -0.09, -0.01))], (0.01, 0.006), to)
    use(S.build('body', coll, C))
    use(head_obj('head', coll, C['face'], (0.0, -0.17, 1.24), 0.105, tilt=14, turn=-8), ['head']); use(ball('haircap', coll, C['hair'], (0.0, -0.11, 1.265), 0.122, 1.0, 1.0, 0.95), ['head'])
    pts = [(math.cos(rad(a)) * 0.115, -0.11 + math.sin(rad(a)) * 0.115, 1.25) for a in range(50, 311, 26)] + [(0.105, -0.19, 1.25), (-0.1, -0.195, 1.25)]   # the hair hangs round the face and beside it, not over the eyes
    hang('hair', pts, 0.42, 0.034, 0.016, 'hair', lean=0.02, sway=0.012, seg=3, bones=['head', 'chest'])
    Sw = Stick(); Sw.chain([(0.11, -0.05, 0.77), (0.0, -0.11, 0.74), (-0.11, -0.05, 0.75), (-0.13, 0.06, 0.72), (-0.05, 0.10, 0.70)], (0.02, 0.012), None, 'weed'); use(Sw.build('weed', coll, C), ['hips', 'chest'])
    hang('weed2', [(0.16, -0.02, 1.0), (-0.1, 0.02, 1.02)], 0.3, 0.02, 0.008, 'weed', lean=0.04, sway=0.02, bones=['chest'])
    l0 = Vector((0.06, -0.06, 1.37))
    for i in range(6): a = i * TAU / 6; use(ball('petal', coll, C['lily'], l0 + Vector((math.cos(a) * 0.045, math.sin(a) * 0.045, 0)), 0.034, 1, 1, 0.45), ['head'])
    use(ball('lilyheart', coll, C['lilyc'], l0 + Vector((0, 0, 0.015)), 0.024), ['head'])
    c = Vector((0.03, -0.40, 0.86)); Rt = Matrix.Rotation(rad(-30), 3, 'X') @ Matrix.Rotation(rad(10), 3, 'Y'); Pl = lambda x, z, y=0.0: c + Rt @ Vector((x, y, z))
    use(ball('lyrebox', coll, C['wood'], Pl(0, -0.02), 0.10, 1.0, 0.3, 1.2, rot=Rt), ['haL'])
    La = Stick()
    for sg in (1, -1): La.chain([Pl(sg * 0.08, 0.05), Pl(sg * 0.10, 0.30)], (0.02, 0.016), None, 'wood')
    La.chain([Pl(-0.11, 0.30), Pl(0.11, 0.30)], (0.018, 0.018), None, 'wood'); use(La.build('lyreframe', coll, C, subdiv=1), ['haL'])
    Ls = Stick()
    for k in range(5): x = (k - 2) * 0.03; Ls.chain([Pl(x * 0.6, -0.08, -0.03), Pl(x, 0.29, -0.02)], (0.004, 0.004), None, 'string')
    use(Ls.build('strings', coll, C, subdiv=0), ['haL'])
    F.build_rig(sc); bind_all()
    R0 = F.R0
    def seat(J, R, pluck=0.0, lift=0.0):
        arm(J, 'L', T(J, R, R0['wrL']), bend=(1, -0.3, -0.5), tip=(-0.5, -0.4, 0.0))
        arm(J, 'R', T(J, R, R0['wrR']) + Vector((0.012 * pluck, -0.004 * pluck, 0.022 * pluck)), bend=(-1, -0.3, -0.5), tip=(0.5, -0.5, -0.2 - 0.6 * pluck))
        for s in ('L', 'R'): J['kn' + s] = R0['kn' + s].copy(); J['an' + s] = R0['an' + s].copy(); J['to' + s] = R0['to' + s].copy()
        J['toR'] = R0['toR'] + Vector((0, 0, 0.035 * lift))
    def play(p):
        J = base(); R = torso(J, yaw=2 * sn(p, 0.5), pitch=2 + 2 * sn(p, 2, 0.1), roll=3 * sn(p)); headpose(J, R, 6 + 4 * sn(p, 1, 0.3), 9 * sn(p, 0.5, 0.3), 5 * sn(p, 1, 0.9))
        seat(J, R, pluck=0.5 + 0.5 * sn(p, 6), lift=max(0.0, sn(p, 3))); return J
    def idle(p):
        J = base(); R = torso(J, yaw=4 * sn(p, 0.5), pitch=-3 + 1.5 * sn(p), roll=2 * sn(p, 1, 0.4)); headpose(J, R, -14 + 2 * sn(p), 14 * sn(p, 0.5, 0.25), 4 * sn(p, 1, 0.6)); seat(J, R, 0.0, 0.0); return J
    def hit(p):
        k = math.sin(math.pi * p); J = base(); R = torso(J, yaw=-10 * k, pitch=-14 * k, roll=6 * k); headpose(J, R, -20 * k, -16 * k, 8 * k); seat(J, R, 0.0, 0.0)
        arm(J, 'R', T(J, R, R0['wrR']) + Vector((-0.08 * k, -0.02 * k, 0.12 * k)), bend=(-1, -0.3, -0.5)); return J
    def death(p):
        f = ease(min(1.0, p / 0.6)); st = math.sin(math.pi * min(1.0, p / 0.35)) * (1 - min(1.0, p / 0.45)); settle = 0.02 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.7) / 0.3)))
        J = base(); R = torso(J, yaw=-6 * st, pitch=-10 * st + 48 * f, roll=8 * st + 14 * f); headpose(J, R, 30 * f, 10 * f, 20 * f)
        arm(J, 'L', T(J, R, R0['wrL']) + Vector((0.06, 0.0, -0.25)) * f, bend=(1, -0.3, -0.5)); arm(J, 'R', T(J, R, R0['wrR']) + Vector((-0.12, 0.02, -0.3)) * f, bend=(-1, -0.3, -0.5))
        for s in ('L', 'R'): J['kn' + s] = R0['kn' + s].copy(); J['an' + s] = R0['an' + s].copy(); J['to' + s] = R0['to' + s].copy()
        J['hips'] = R0['hips'] + Vector((0, 0, -0.02 * f + settle)); return J
    def vanish(p):
        """he sees you: a sharp look up, then he slips backward off the stone and under the water, the lyre hugged to him"""
        a = ease(min(1.0, p / 0.25)); s = ease(max(0.0, (p - 0.3) / 0.7)); back = Vector((0, 0.55, 0)) * s + Vector((0, 0, -1.3)) * s * s
        J = base(); R = torso(J, hips=R0['hips'] + back + Vector((0, -0.04 * a, 0.03 * a)), yaw=6 * a, pitch=-16 * a + 30 * s, roll=0); headpose(J, R, -34 * a + 50 * s, 10 * a, -6 * a)
        arm(J, 'L', T(J, R, R0['wrL']) + Vector((0.02, 0.02, 0.06)) * s, bend=(1, -0.3, -0.5), tip=(-0.5, -0.4, 0.3)); arm(J, 'R', T(J, R, R0['wrR']) + Vector((-0.02, 0.03, 0.08)) * s, bend=(-1, -0.3, -0.5), tip=(0.5, -0.3, 0.3))
        for sd in ('L', 'R'):
            J['kn' + sd] = R0['kn' + sd] + back + Vector((0, 0.08, 0.10)) * s; J['an' + sd] = R0['an' + sd] + back + Vector((0, 0.22, 0.30)) * s; J['to' + sd] = R0['to' + sd] + back + Vector((0, 0.24, 0.34)) * s
        return J
    F.clip('play', 48, play); F.clip('idle', 48, idle); F.clip('hit', 10, hit); F.clip('death', 32, death); F.clip('vanish', 24, vanish)

# ================================================================= the draugr
def build_draugr():
    mats({'skin': '#6a7a82', 'mail': '#7b8187', 'cloth': '#3f4a4e', 'soak': '#2c3539', 'rot': '#22181a', 'helm': '#6b6760', 'rust': '#8a5a36', 'board': '#5a4632', 'iron': '#8f9296', 'weed': '#4b6d46', 'barnacle': '#d8d0bc', 'mussel': '#2e3440',
          'beard': '#b9b8a8', 'tooth': '#e6dfc6', 'net': '#c9c0a6', 'crab': '#8a4a3a', 'rope': '#8a7a56', 'stone': '#6c6a62', 'drip': '#c4d6d8'}, 'draugr', '#6a7a82', patterns={'mail': 'woven:z'},
         wet=('skin', 'mail', 'helm', 'iron', 'soak', 'face'))   # wet (Robin, 2026-10-14): a glossy band on skin and metal (soaked wood and hair go dark, not glossy)
    P = {'hips': (0, 0.04, 1.0), 'chest': (0, -0.06, 1.44), 'neck': (0.0, -0.12, 1.60), 'headb': (0.02, -0.16, 1.66), 'headt': (0.04, -0.24, 1.86), 'shL': (0.34, -0.05, 1.52), 'shR': (-0.34, -0.05, 1.52),
         'elL': (0.44, -0.08, 1.24), 'elR': (-0.44, -0.08, 1.24), 'wrL': (0.40, -0.12, 0.94), 'wrR': (-0.40, -0.12, 0.94), 'haL': (0.38, -0.14, 0.84), 'haR': (-0.38, -0.14, 0.84),
         'hipL': (0.14, 0.04, 0.96), 'hipR': (-0.14, 0.04, 0.96), 'knL': (0.15, -0.02, 0.52), 'knR': (-0.15, -0.02, 0.52), 'anL': (0.15, -0.04, 0.10), 'anR': (-0.15, -0.04, 0.10), 'toL': (0.15, -0.22, 0.04), 'toR': (-0.15, -0.22, 0.04)}
    for n, p in P.items(): J0(n, p)
    F.bone('hips', 'hips', 'chest'); F.bone('chest', 'chest', 'neck', 'hips'); F.bone('neck', 'neck', 'headb', 'chest'); F.bone('head', 'headb', 'headt', 'neck')
    for s, sx in (('L', 1), ('R', -1)):
        F.bone('up' + s, 'sh' + s, 'el' + s, 'chest', (sx, 0, 0)); F.bone('lo' + s, 'el' + s, 'wr' + s, 'up' + s, (sx, 0, 0)); F.bone('ha' + s, 'wr' + s, 'ha' + s, 'lo' + s, (sx, 0, 0))
        F.bone('th' + s, 'hip' + s, 'kn' + s, 'hips', (sx, 0, 0)); F.bone('sh' + s, 'kn' + s, 'an' + s, 'th' + s, (sx, 0, 0)); F.bone('ft' + s, 'an' + s, 'to' + s, 'sh' + s, (sx, 0, 0))
    S = Stick(); j = F.J
    hips = S.add(j['hips'], (0.23, 0.20), mat='cloth'); belly = S.add((0, -0.05, 1.20), (0.29, 0.25), hips, 'mail'); chest = S.add(j['chest'], (0.31, 0.23), belly, 'mail'); neck = S.add(j['neck'], 0.11, chest, 'skin')
    for s in ('L', 'R'):
        sh = S.add(j['sh' + s], 0.10, chest, 'mail'); el = S.add(j['el' + s], 0.08, sh, 'skin'); wr = S.add(j['wr' + s], 0.07, el, 'skin'); ha = S.add(j['ha' + s], (0.08, 0.06), wr, 'skin')
        for k in range(4): S.chain([j['ha' + s] + Vector(((k - 1.5) * 0.03, -0.06, -0.02)), j['ha' + s] + Vector(((k - 1.5) * 0.035, -0.09, -0.10))], (0.018, 0.012), ha, 'skin')
        hip = S.add(j['hip' + s], 0.13, hips, 'cloth'); kn = S.add(j['kn' + s], 0.11, hip, 'soak'); an = S.add(j['an' + s], 0.085, kn, 'skin'); S.add(j['to' + s], (0.07, 0.10), an, 'skin')   # the trousers soaked dark from the knee down
    use(S.build('body', coll, C))
    # water running off him: drops hanging from the elbows, the hem, the fingertips and the point of the blade, and a few fallen
    for (x, y, z) in ((0.46, -0.10, 1.18), (-0.47, -0.08, 1.16), (0.03, -0.24, 1.50), (0.40, -0.16, 0.86), (-0.40, -0.18, 0.80), (0.16, -0.30, 0.84), (-0.2, 0.2, 0.84), (0.26, 0.19, 1.42)): use(ball('drop', coll, C['drip'], (x, y, z), 0.016, 0.6, 0.6, 1.9), None)
    hang('hemdrip', [(0.2, -0.22, 0.86), (-0.12, -0.26, 0.86), (0.05, 0.24, 0.86)], 0.07, 0.012, 0.004, 'drip', bones=['hips'])
    use(loft('mailhem', coll, C['mail'], [((0.0, 0.02, 1.02), 0.27, 0.235), ((0.0, 0.02, 0.86), 0.285, 0.245)], seg=20, wave=lambda k, a: 1 + (0.07 * math.sin(7 * a) if k == 1 else 0)), ['hips'])
    use(ball('gash', coll, C['rot'], (0.09, -0.33, 1.18), 0.09, 0.65, 0.5, 1.5), ['hips', 'chest']); use(ball('gut', coll, C['skin'], (0.09, -0.36, 1.17), 0.065, 0.7, 0.6, 1.1), ['hips', 'chest'])
    hang('rags', [(0.22, 0.20, 1.50), (-0.18, 0.22, 1.48), (0.04, 0.26, 1.42), (0.30, 0.10, 1.40)], 0.55, 0.05, 0.015, 'cloth', lean=0.05, sway=0.02, bones=['chest', 'hips'])
    hang('kelp', [(0.26, -0.18, 1.56), (-0.30, 0.0, 1.55), (0.1, -0.3, 1.5), (0.02, -0.2, 1.95), (-0.12, -0.1, 1.98)], 0.45, 0.045, 0.012, 'weed', lean=0.05, sway=0.04, bones=['chest', 'head'])   # fronds, not sticks
    for (x, y, z) in ((0.24, -0.26, 1.34), (0.30, -0.22, 1.26), (-0.28, -0.20, 1.10), (-0.08, -0.30, 1.42), (0.14, -0.32, 1.02), (-0.2, -0.28, 1.30)): use(ball('barnacle', coll, C['barnacle'], (x, y, z), 0.032, 1, 0.5, 0.8), ['chest', 'hips'])
    for (x, y, z) in ((0.27, -0.24, 1.30), (0.22, -0.28, 1.38), (-0.31, -0.16, 1.14), (-0.25, -0.24, 1.06), (0.1, -0.34, 1.08)): use(ball('mussel', coll, C['mussel'], (x, y, z), 0.028, 0.7, 0.5, 1.3), ['chest', 'hips'])
    N = Stick()                                     # the net: strands from the right shoulder to the left hip, crossed
    for k in range(6): N.chain([(-0.30 + k * 0.03, -0.26 - 0.01 * k, 1.56 - k * 0.04), (0.0 + k * 0.03, -0.33, 1.30 - k * 0.03), (0.25 + k * 0.02, -0.26, 1.02 - k * 0.02)], (0.008, 0.008), None, 'net')
    for k in range(5): N.chain([(-0.34 + k * 0.14, -0.30 + 0.0 * k, 1.44 - k * 0.09), (-0.18 + k * 0.14, -0.33, 1.18 - k * 0.09)], (0.008, 0.008), None, 'net')
    use(N.build('net', coll, C, subdiv=0), ['chest', 'hips', 'upL'])
    use(ball('crab', coll, C['crab'], (0.32, -0.14, 1.62), 0.06, 1.2, 1.0, 0.55), ['chest'])
    Cr = Stick()
    for k in range(3):
        for sx in (1, -1): a = rad(-40 + k * 40); Cr.chain([(0.32 + sx * 0.05, -0.14 + 0.02 * k, 1.62), (0.32 + sx * (0.11 + 0.02 * k), -0.14 + 0.06 * math.sin(a), 1.58)], (0.012, 0.006), None, 'crab')
    use(Cr.build('crablegs', coll, C, subdiv=0), ['chest'])
    use(loft('noose', coll, C['rope'], [((0.0, -0.1, 1.56), 0.15, 0.13), ((0.0, -0.1, 1.585), 0.15, 0.13)], seg=16), ['neck', 'chest'])
    Rp = Stick(); Rp.chain([(0.0, 0.03, 1.56), (0.06, 0.22, 1.30), (0.10, 0.26, 1.05)], (0.018, 0.012), None, 'rope'); use(Rp.build('rope', coll, C, subdiv=1), ['chest'])   # the frayed end of the rope down his back (a rope to a sinker read as a mace)
    hc = Vector((0.05, -0.22, 1.70))
    use(head_obj('head', coll, C['face'], hc, 0.15, tilt=25, turn=-15), ['head'])
    use(ball('jaw', coll, C['skin'], hc + Vector((0.0, -0.07, -0.16)), 0.075, 1.25, 1.0, 0.55), ['head']); use(ball('mouth', coll, C['rot'], hc + Vector((0.0, -0.10, -0.11)), 0.055, 1.1, 0.7, 0.7), ['head'])
    for k in (-1.5, -0.5, 0.5, 1.5): use(ball('tooth', coll, C['tooth'], hc + Vector((k * 0.03, -0.17, -0.14)), 0.012, 1, 1, 1.8), ['head'])
    hang('beard', [hc + Vector((k * 0.035, -0.13, -0.19)) for k in (-2, -1, 0, 1, 2)], 0.3, 0.03, 0.01, 'beard', lean=0.02, sway=0.015, bones=['head'])
    hang('beardweed', [hc + Vector((0.05, -0.14, -0.2)), hc + Vector((-0.06, -0.13, -0.19))], 0.36, 0.014, 0.005, 'weed', lean=0.02, sway=0.02, bones=['head'])
    Rh = Matrix.Rotation(rad(-25), 3, 'X') @ Matrix.Rotation(rad(-15), 3, 'Z')
    use(ball('helm', coll, C['helm'], hc + Rh @ Vector((0, 0.01, 0.09)), 0.165, 1.0, 1.0, 0.62, rot=Rh), ['head'])
    use(loft('helmrim', coll, C['iron'], [(hc + Rh @ Vector((0, 0.01, 0.055)), 0.165, 0.165), (hc + Rh @ Vector((0, 0.01, 0.085)), 0.16, 0.16)], seg=16), ['head'])
    Sn = Stick(); Sn.chain([hc + Rh @ Vector((0, -0.16, 0.08)), hc + Rh @ Vector((0, -0.17, -0.06))], (0.016, 0.012), None, 'iron'); use(Sn.build('nasal', coll, C, subdiv=1), ['head'])
    for (dx, dy, dz) in ((0.08, -0.08, 0.14), (-0.10, 0.02, 0.12), (0.02, 0.10, 0.1)): use(ball('rust', coll, C['rust'], hc + Rh @ Vector((dx, dy, dz)), 0.05, 1, 1, 0.3, rot=Rh), ['head'])
    Rs_ = Stick()
    for (dx, dy) in ((0.12, -0.1), (-0.09, -0.12), (0.0, 0.14)): Rs_.chain([hc + Rh @ Vector((dx, dy, 0.07)), hc + Rh @ Vector((dx * 1.1, dy * 1.1, -0.04))], (0.012, 0.006), None, 'rust')
    use(Rs_.build('ruststreaks', coll, C, subdiv=0), ['head'])
    for (dx, dy, dz) in ((0.1, -0.06, 0.17), (0.13, -0.02, 0.15), (-0.12, 0.05, 0.16)): use(ball('helmmussel', coll, C['mussel'], hc + Rh @ Vector((dx, dy, dz)), 0.025, 0.7, 0.5, 1.2, rot=Rh), ['head'])
    # the shield on the left forearm, rotten, a bite from the rim, limpets, weed from its edge; the boss rusted
    sc_ = Vector((0.30, -0.36, 1.22)); Rs = Matrix.Rotation(rad(78), 3, 'X') @ Matrix.Rotation(rad(-12), 3, 'Z')
    disc = loft('shield', coll, C['board'], [(Vector((0, 0, -0.02)), 0.34, 0.34), (Vector((0, 0, 0.02)), 0.34, 0.34)], seg=24, wave=lambda k, a: 0.72 if 1.9 < a < 2.5 else 1.0); disc.rotation_euler = Rs.to_euler(); disc.location = sc_; use(disc, ['loL'])
    for k in (-0.5, 0.5): b = Stick(); b.chain([sc_ + Rs @ Vector((k * 0.2, -0.30, 0.025)), sc_ + Rs @ Vector((k * 0.2, 0.30, 0.025))], (0.005, 0.005), None, 'rot'); use(b.build('board%d' % int(k * 2), coll, C, subdiv=0), ['loL'])   # the seams between the boards, thin
    use(ball('boss', coll, C['rust'], sc_ + Rs @ Vector((0, 0, 0.045)), 0.075, 1, 1, 0.6, rot=Rs), ['loL'])
    for (dx, dy) in ((0.2, 0.12), (-0.18, 0.2), (0.1, -0.22), (-0.24, -0.08)): use(ball('limpet', coll, C['barnacle'], sc_ + Rs @ Vector((dx, dy, 0.03)), 0.03, 1, 1, 0.5, rot=Rs), ['loL'])
    hang('shieldweed', [sc_ + Rs @ Vector((0.28, -0.18, 0.02)), sc_ + Rs @ Vector((-0.3, -0.1, 0.02))], 0.3, 0.018, 0.006, 'weed', lean=0.03, sway=0.02, bones=['loL'])
    # the sword hanging from the right hand, point down and a little back, notched, weed wound on the blade
    o = j['haR'] + Vector((0, -0.02, -0.02)); U = Vector((0.0, 0.3, -0.95)).normalized(); V = Vector((1, 0, 0)); W = U.cross(V)
    use(poly_blade('blade', coll, C['iron'], [(0.0, 0.03), (0.42, 0.03), (0.46, 0.012), (0.50, 0.03), (0.70, 0.025), (0.76, 0.0), (0.70, -0.025), (0.60, -0.03), (0.56, -0.012), (0.52, -0.03), (0.0, -0.03)], 0.012, o, U, V, W), ['haR'])
    Sg = Stick(); Sg.chain([o - U * 0.14, o - U * 0.02], (0.024, 0.02), None, 'rot'); Sg.chain([o - V * 0.07 - U * 0.01, o + V * 0.07 - U * 0.01], (0.02, 0.02), None, 'rust'); use(Sg.build('hilt', coll, C, subdiv=1), ['haR'])
    use(ball('pommel', coll, C['rust'], o - U * 0.16, 0.03), ['haR'])
    Sw = Stick(); Sw.chain([o + U * 0.2 + V * 0.03, o + U * 0.32 - V * 0.03 + W * 0.02, o + U * 0.45 + V * 0.03, o + U * 0.6 - V * 0.02 - W * 0.02], (0.012, 0.006), None, 'weed'); use(Sw.build('bladeweed', coll, C, subdiv=1), ['haR'])
    use(ball('tipdrop', coll, C['drip'], o + U * 0.78, 0.014, 0.6, 0.6, 1.9), ['haR'])
    F.build_rig(sc); bind_all()
    R0 = F.R0
    def arms(J, R, sword=None, shield=None, sw_tip=(0, 0.3, -0.95), sh_bend=(1, -0.5, 0.3)):
        arm(J, 'R', sword if sword is not None else T(J, R, (-0.42, -0.02, 0.92)), bend=(-1, 0.2, 0), tip=sw_tip)
        arm(J, 'L', shield if shield is not None else T(J, R, (0.26, -0.36, 1.20)), bend=sh_bend, tip=(-0.8, -0.3, 0.2))
    def legs(J, left=(0.17, 0.22, 0.10), right=(-0.14, -0.18, 0.10), ltoe=(0, -1, -0.3), rtoe=(0, -1, -0.3)):
        leg(J, 'L', left, toe=ltoe); leg(J, 'R', right, toe=rtoe)
    def idle(p):
        j_ = max(0.0, sn(p, 1, 0.1)) ** 7
        J = base(); R = torso(J, hips=(0.01 * sn(p), 0.04, 1.0 - 0.01 * abs(sn(p))), yaw=2 * sn(p, 0.5), pitch=10 + 2 * sn(p), roll=3 * sn(p, 1, 0.3)); headpose(J, R, 22 + 2 * sn(p, 2), 12 * sn(p, 0.5) + 28 * j_, 10 + 4 * sn(p))
        arms(J, R); legs(J); return J
    def walk(p):
        w = p; k = 0.5 + 0.5 * math.cos(TAU * (w - 0.55)); heave = max(0.0, math.sin(TAU * (w + 0.05)))
        fr = step('R', w, 0.55, 0.14, 0.62, -0.02, 0.10, -0.14)
        ly = 0.42 - 0.34 * (0.5 - 0.5 * math.cos(TAU * ((w + 0.5) % 1.0))); fl = Vector((0.17, ly, 0.10 + 0.02 * max(0.0, math.sin(TAU * (w + 0.5)))))
        J = base(); R = torso(J, hips=(0.03 * sn(p), 0.04, 0.98 + 0.06 * heave), yaw=-6 * sn(p), pitch=12 + 6 * heave, roll=7 * sn(p, 1, 0.05)); headpose(J, R, 22 + 3 * sn(p, 2), 8 * sn(p, 0.5), 10 + 3 * sn(p))
        arms(J, R, sword=T(J, R, (-0.42, -0.02 - 0.06 * sn(p), 0.92))); legs(J, left=fl, right=fr, ltoe=(0, -1, -0.15)); return J
    def windup(p):
        k = ease(min(1.0, p * 1.15)); t = 1.5 * sn(p, 4) * k
        J = base(); R = torso(J, hips=(0, 0.04 + 0.10 * k, 1.0 - 0.03 * k), yaw=-12 * k, pitch=10 - 22 * k + t, roll=-6 * k); headpose(J, R, 22 - 30 * k, 10 * k, 10)
        arms(J, R, sword=T(J, R, (-0.22, 0.12, 1.98)), shield=T(J, R, (0.42, -0.08, 0.98)), sw_tip=(-0.1, 0.55, 0.8), sh_bend=(1, 0, 0)); legs(J, left=(0.2, 0.34, 0.10)); return J
    def attack(p):
        a = ease(min(1.0, p / 0.42)); back = ease(max(0.0, (p - 0.6) / 0.4)); k = 1 - a
        sw = T if True else None
        J = base(); R = torso(J, hips=(0, 0.04 + 0.10 * k - 0.16 * a * (1 - back), 1.0 - 0.03 * k - 0.10 * a * (1 - back)), yaw=-12 * k + 8 * a * (1 - back), pitch=-12 * k + 36 * a * (1 - back) + 10 * back, roll=-6 * k + 4 * a); headpose(J, R, -8 * k + 20 * a, 10 * k, 10)
        sword = T(J, R, (-0.22, 0.12, 1.98)) * k + T(J, R, (-0.12, -0.62, 0.70)) * a * (1 - back) + T(J, R, (-0.42, -0.02, 0.92)) * back
        arms(J, R, sword=sword, shield=T(J, R, (0.42, -0.08, 0.98)) * (1 - back) + T(J, R, (0.26, -0.36, 1.20)) * back, sw_tip=(-0.1, 0.55 * k - 0.4 * a, 0.8 * k - 0.95 * a), sh_bend=(1, -0.2, 0.1)); legs(J, left=(0.2, 0.34 - 0.12 * a, 0.10), right=(-0.14, -0.18 - 0.1 * a, 0.10)); return J
    def hit(p):
        k = math.sin(math.pi * p); J = base(); R = torso(J, hips=(0, 0.04 + 0.08 * k, 1.0 - 0.02 * k), yaw=10 * k, pitch=10 - 14 * k, roll=6 * k); headpose(J, R, 22 - 24 * k, 18 * k, 10 - 6 * k)
        arms(J, R, sword=T(J, R, (-0.46, -0.14, 1.02)), shield=T(J, R, (0.36, -0.30, 1.30))); legs(J); return J
    def shield(p):
        k = ease(min(1.0, p * 2.2)); t = sn(p, 3) * 2 * k
        J = base(); R = torso(J, hips=(0, 0.04 + 0.14 * k, 1.0 - 0.04 * k), yaw=24 * k, pitch=10 - 12 * k + t, roll=6 * k); headpose(J, R, 22 - 10 * k, 38 * k, 10 + 8 * k)
        arms(J, R, sword=T(J, R, (-0.44, -0.04, 0.9)), shield=T(J, R, (0.12, -0.30, 1.56)), sh_bend=(1, -0.3, 0.6)); legs(J, left=(0.2, 0.36, 0.10)); return J
    def death(p):
        f1 = ease(min(1.0, p / 0.4)); f2 = ease(min(1.0, max(0.0, (p - 0.35) / 0.4))); settle = 0.02 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.8) / 0.2)))
        J = base(); hips = Vector((0, 0.04, 1.0)) * (1 - f1) + Vector((0, 0.0, 0.62)) * f1; hips = hips * (1 - f2) + Vector((0, -0.2, 0.30)) * f2
        R = torso(J, hips=hips + Vector((0, 0, settle)), yaw=6 * f1, pitch=10 + 30 * f1 + 48 * f2, roll=5 * f1); headpose(J, R, 22 + 10 * f2, 10 * f1, 10)
        arms(J, R, sword=T(J, R, (-0.42, -0.02, 0.92)) * (1 - f2) + Vector((-0.55, -0.55, 0.08)) * f2, shield=T(J, R, (0.26, -0.36, 1.20)) * (1 - f2) + Vector((0.5, -0.5, 0.1)) * f2, sw_tip=(0, 0.3, -0.95) if f2 < 0.5 else (0, -1, 0), sh_bend=(1, 0, 0.2))
        leg(J, 'L', Vector((0.17, 0.22, 0.10)) * (1 - f2) + Vector((0.18, 0.62, 0.10)) * f2, toe=(0, -1, -0.3) if f2 < 0.5 else (0, 1, -0.5)); leg(J, 'R', Vector((-0.14, -0.18, 0.10)) * (1 - f1) + Vector((-0.15, 0.02, 0.10)) * f1 * (1 - f2) + Vector((-0.16, 0.6, 0.10)) * f2, toe=(0, -1, -0.3) if f2 < 0.5 else (0, 1, -0.5)); return J
    F.clip('idle', 48, idle); F.clip('walk', 40, walk); F.clip('windup', 24, windup); F.clip('attack', 20, attack); F.clip('hit', 10, hit); F.clip('shield', 16, shield); F.clip('death', 32, death)

# ================================================================= Trollmor
def build_troll_mor():
    mats({'skin': '#8e8471', 'hide': '#6f5a44', 'apron': '#9c9478', 'hair': '#8a8478', 'wicker': '#a88f5e', 'bead': '#c05a30', 'bone': '#e6dcc0', 'eye': '#f08a2a', 'dark': '#3a3330', 'wood': '#5b4632', 'nail': '#3a3330'})
    P = {'hips': (0, 0.1, 1.55), 'chest': (0, -0.05, 2.45), 'neck': (0, -0.25, 2.95), 'headb': (0, -0.35, 3.05), 'headt': (0, -0.55, 3.55), 'shL': (0.78, -0.1, 2.62), 'shR': (-0.78, -0.1, 2.62),
         'elL': (1.05, -0.3, 1.95), 'wrL': (0.85, -0.75, 1.5), 'haL': (0.72, -0.95, 1.42), 'elR': (-1.05, -0.15, 1.9), 'wrR': (-1.15, -0.5, 1.15), 'haR': (-1.12, -0.65, 1.0),
         'hipL': (0.42, 0.1, 1.35), 'knL': (0.45, -0.05, 0.7), 'anL': (0.48, -0.2, 0.2), 'toL': (0.5, -0.55, 0.12), 'hipR': (-0.42, 0.1, 1.35), 'knR': (-0.45, -0.05, 0.7), 'anR': (-0.48, -0.2, 0.2), 'toR': (-0.5, -0.55, 0.12)}
    for n, p in P.items(): J0(n, p)
    F.bone('hips', 'hips', 'chest'); F.bone('chest', 'chest', 'neck', 'hips'); F.bone('neck', 'neck', 'headb', 'chest'); F.bone('head', 'headb', 'headt', 'neck')
    for s, sx in (('L', 1), ('R', -1)):
        F.bone('up' + s, 'sh' + s, 'el' + s, 'chest', (sx, 0, 0)); F.bone('lo' + s, 'el' + s, 'wr' + s, 'up' + s, (sx, 0, 0)); F.bone('ha' + s, 'wr' + s, 'ha' + s, 'lo' + s, (sx, 0, 0))
        F.bone('th' + s, 'hip' + s, 'kn' + s, 'hips', (sx, 0, 0)); F.bone('sh' + s, 'kn' + s, 'an' + s, 'th' + s, (sx, 0, 0)); F.bone('ft' + s, 'an' + s, 'to' + s, 'sh' + s, (sx, 0, 0))
    S = Stick(); j = F.J
    hips = S.add(j['hips'], (0.85, 0.70), mat='hide'); chest = S.add(j['chest'], (0.70, 0.60), hips); neck = S.add(j['neck'], 0.30, chest)
    for s in ('L', 'R'):
        sh = S.add(j['sh' + s], 0.32, chest); el = S.add(j['el' + s], 0.26, sh); wr = S.add(j['wr' + s], 0.22, el); ha = S.add(j['ha' + s], 0.30, wr)
        d = (j['ha' + s] - j['wr' + s]).normalized()
        for k in range(4): b = j['ha' + s] + Vector(((k - 1.5) * 0.1, 0, 0)); S.chain([b + d * 0.2, b + d * 0.42 + Vector((0, 0, -0.1))], (0.08, 0.04), ha)
        hip = S.add(j['hip' + s], 0.35, hips, 'hide'); kn = S.add(j['kn' + s], 0.3, hip); an = S.add(j['an' + s], 0.28, kn); S.add(j['to' + s], (0.3, 0.42), an)
    use(S.build('body', coll, C))
    Ss = Stick(); Ss.chain([j['haR'] + Vector((0, 0, 0.3)), j['haR'] + Vector((-0.12, -0.2, -0.95))], (0.07, 0.07), None, 'wood'); use(Ss.build('staff', coll, C, subdiv=1), ['haR'])
    use(loft('skirt', coll, C['hide'], [((0, 0.1, 1.55), 0.95, 0.8), ((0, 0.1, 1.0), 1.15, 0.95), ((0, 0.1, 0.5), 1.3, 1.08), ((0, 0.1, 0.2), 1.35, 1.12)], seg=24, wave=lambda k, a: 1 + (0.06 * math.sin(9 * a) if k == 3 else 0)), ['hips', 'thL', 'thR'], 0.4)
    use(loft('apron', coll, C['apron'], [((0, 0.06, 1.55), 1.0, 0.87), ((0, 0.06, 1.0), 1.17, 0.98), ((0, 0.06, 0.35), 1.32, 1.12)], seg=16, arc=(math.pi * 1.2, math.pi * 1.8), closed=False, wave=lambda k, a: 1.04, edge=lambda k, i, n: 1 + (0.03 * math.sin(k * 2.1 + i) if k == 2 else 0)), ['hips', 'thL', 'thR'], 0.4)
    hc = Vector((0, -0.55, 3.2)); use(ball('head', coll, C['skin'], hc, 0.55, 1.05, 1.0, 0.95), ['head'])
    use(ball('brow', coll, C['hair'], hc + Vector((0, -0.42, 0.22)), 0.16, 2.6, 1.0, 0.6), ['head'])
    for sx in (1, -1):
        use(ball('eye', coll, C['eye'], hc + Vector((sx * 0.2, -0.50, 0.12)), 0.055), ['head']); use(ball('socket', coll, C['dark'], hc + Vector((sx * 0.2, -0.47, 0.12)), 0.09, 1, 0.6, 0.8), ['head'])
        use(ball('ear', coll, C['skin'], hc + Vector((sx * 0.6, 0.0, 0.05)), 0.26, 0.5, 0.9, 1.1), ['head'])
    Sn = Stick(); Sn.chain([hc + Vector((0, -0.48, 0.0)), hc + Vector((0, -0.85, -0.2)), hc + Vector((0, -0.98, -0.5)), hc + Vector((0.02, -0.92, -0.62))], [0.17, 0.14, 0.11, 0.14], None, 'skin'); use(Sn.build('nose', coll, C), ['head'])
    use(ball('wart', coll, C['dark'], hc + Vector((0.1, -0.9, -0.25)), 0.05), ['head']); use(ball('mouth', coll, C['dark'], hc + Vector((0, -0.46, -0.36)), 0.26, 1.0, 0.5, 0.22), ['head']); use(ball('ring', coll, C['bead'], hc + Vector((0.62, -0.1, -0.2)), 0.06), ['head'])
    row = [(math.sin(rad(a)) * 0.78, -0.1 + math.cos(rad(a)) * 0.66, 2.75 + 0.06 * math.sin(a * 0.7)) for a in range(-150, 151, 11)]
    hang('mane', row, 2.2, 0.24, 0.10, 'hair', lean=0.22, sway=0.06, seg=4, bones=['chest', 'hips', 'head'], blend=0.35)      # thick and close: a shaggy mass, not a cage of bars
    hang('crown', [(hc.x + math.sin(rad(a)) * 0.45, hc.y + math.cos(rad(a)) * 0.4, hc.z + 0.35) for a in range(-160, 161, 32)], 0.9, 0.12, 0.05, 'hair', lean=0.3, sway=0.04, bones=['head'])
    for i in range(9): a = rad(-72 + i * 18); use(ball('bead', coll, C['bead'] if i % 2 else C['bone'], (math.sin(a) * 0.5, -0.72 - math.cos(a) * 0.05, 2.55 - math.cos(a) * 0.25), 0.07), ['chest'])
    bc = Vector((0.98, -0.95, 1.35)); use(loft('basket', coll, C['wicker'], [(bc + Vector((0, 0, -0.3)), 0.42, 0.36), (bc + Vector((0, 0, 0.3)), 0.52, 0.44)], seg=16, wave=lambda k, a: 1 + 0.04 * math.sin(10 * a)), ['haL'])
    use(ball('child', coll, C['skin'], bc + Vector((0.05, -0.1, 0.45)), 0.22), ['haL']); use(ball('childnose', coll, C['skin'], bc + Vector((0.05, -0.33, 0.40)), 0.07, 1, 1.6, 1), ['haL'])
    for sx in (1, -1): use(ball('childeye', coll, C['eye'], bc + Vector((0.05 + sx * 0.08, -0.30, 0.50)), 0.03), ['haL'])
    hang('childhair', [bc + Vector((0.05 + k * 0.08, 0.02, 0.62)) for k in (-1, 0, 1)], 0.25, 0.05, 0.02, 'hair', lean=0.15, bones=['haL'])
    F.build_rig(sc); bind_all()
    R0 = F.R0
    def arms(J, R, staff=None, basket=None, st_tip=(-0.1, -0.5, -0.85)):
        arm(J, 'R', staff if staff is not None else T(J, R, R0['wrR']), bend=(-1, 0.3, 0), tip=st_tip)
        arm(J, 'L', basket if basket is not None else T(J, R, R0['wrL']), bend=(1, -0.2, 0), tip=(-0.6, -0.8, -0.3))
    def legs(J, left=None, right=None):
        leg(J, 'L', left if left is not None else R0['anL'], toe=(0, -1, -0.25), bend=(0, -1, 0)); leg(J, 'R', right if right is not None else R0['anR'], toe=(0, -1, -0.25), bend=(0, -1, 0))
    def idle(p):
        J = base(); R = torso(J, hips=(0, 0.1, 1.55 - 0.02 * abs(sn(p))), yaw=3 * sn(p, 0.5), pitch=6 + 2 * sn(p), roll=3 * sn(p)); headpose(J, R, 4 + 3 * sn(p, 1, 0.2), 12 * sn(p, 0.5, 0.3), 5 * sn(p))
        arms(J, R, staff=T(J, R, R0['wrR']) + Vector((0, 0, 0.12 * max(0.0, sn(p, 2))))); legs(J); return J
    def walk(p):
        heave = 0.5 + 0.5 * math.cos(TAU * 2 * p); fl = step('L', p, 0.55, 0.14, 0.68, -0.2, 0.2, 0.48); fr = step('R', p + 0.5, 0.55, 0.14, 0.68, -0.2, 0.2, -0.48)
        J = base(); R = torso(J, hips=(0.06 * sn(p, 1, 0.1), 0.1, 1.52 + 0.05 * (1 - heave)), yaw=-4 * sn(p), pitch=8 + 2 * sn(p, 2), roll=7 * sn(p, 1, 0.1)); headpose(J, R, 4 + 3 * sn(p, 2, 0.3), 5 * sn(p), 6 * sn(p, 1, 0.1))
        plant = 0.5 - 0.5 * math.cos(TAU * (p + 0.5))
        arms(J, R, staff=T(J, R, R0['wrR']) + Vector((0, -0.35 * plant, 0.15 * math.sin(math.pi * plant)))); legs(J, left=fl, right=fr); return J
    def windup(p):
        k = ease(min(1.0, p * 1.2)); t = 2.0 * sn(p, 4) * k
        J = base(); R = torso(J, hips=(0, 0.1 + 0.2 * k, 1.55 - 0.05 * k), yaw=10 * k, pitch=6 - 20 * k + t, roll=-6 * k); headpose(J, R, -16 * k, -8 * k, 5)
        arms(J, R, staff=T(J, R, (-0.55, -0.1, 3.85)), basket=T(J, R, (0.62, -0.70, 1.62)), st_tip=(-0.15, -0.4, 0.9)); legs(J, left=(0.5, 0.1, 0.2)); return J
    def attack(p):
        a = ease(min(1.0, p / 0.45)); back = ease(max(0.0, (p - 0.58) / 0.42)); k = 1 - a
        J = base(); R = torso(J, hips=(0, 0.1 + 0.2 * k - 0.3 * a * (1 - back), 1.55 - 0.05 * k - 0.16 * a * (1 - back)), yaw=10 * k - 6 * a, pitch=-20 * k + 32 * a * (1 - back) + 6 * back, roll=-6 * k + 4 * a); headpose(J, R, -16 * k + 14 * a, -8 * k, 5)
        staff = T(J, R, (-0.55, -0.1, 3.85)) * k + T(J, R, (-0.5, -2.1, 0.55)) * a * (1 - back) + T(J, R, R0['wrR']) * back
        arms(J, R, staff=staff, basket=T(J, R, (0.62, -0.70, 1.62)) * (1 - back) + T(J, R, R0['wrL']) * back, st_tip=(-0.15, -0.4 * k - 0.9 * a, 0.9 * k - 0.4 * a)); legs(J, left=(0.5, 0.1 - 0.25 * a, 0.2), right=(-0.48, -0.2 - 0.1 * a, 0.2)); return J
    def hit(p):
        k = math.sin(math.pi * p); J = base(); R = torso(J, hips=(0, 0.1 + 0.15 * k, 1.55 - 0.03 * k), yaw=8 * k, pitch=6 - 9 * k, roll=6 * k); headpose(J, R, -10 * k, 20 * k, 8 * k)
        arms(J, R, staff=T(J, R, R0['wrR']) + Vector((0, 0, 0.2 * k)), basket=T(J, R, R0['wrL']) + Vector((-0.1 * k, 0.05 * k, 0.15 * k))); legs(J); return J
    def shield(p):
        k = ease(min(1.0, p * 2.2)); t = sn(p, 3) * 2 * k
        J = base(); R = torso(J, hips=(0, 0.1 + 0.25 * k, 1.55 - 0.05 * k), yaw=30 * k, pitch=6 - 8 * k + t, roll=5 * k); headpose(J, R, 8 * k, 40 * k, 10 * k)
        arms(J, R, staff=T(J, R, R0['wrR']) + Vector((0, 0, 0.1 * k)), basket=T(J, R, (0.35, -0.9, 2.85)) * k + T(J, R, R0['wrL']) * (1 - k)); legs(J, left=(0.5, 0.15, 0.2)); return J
    def death(p):
        """she sinks onto her knees and slumps forward over the basket (Robin, 2026-10-14: no fall to the side)"""
        f1 = ease(min(1.0, p / 0.45)); f2 = ease(min(1.0, max(0.0, (p - 0.4) / 0.5))); settle = 0.03 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.85) / 0.15)))
        J = base(); R = torso(J, hips=(0, 0.1 + 0.1 * f1 + 0.05 * f2, 1.55 - 0.6 * f1 - 0.18 * f2 + settle), yaw=-6 * f1 + 4 * f2, pitch=6 + 24 * f1 + 44 * f2, roll=4 * f1 - 2 * f2); headpose(J, R, 16 * f1 + 30 * f2, 10 * f1, 10 * f1 + 6 * f2)
        arms(J, R, staff=T(J, R, R0['wrR']) * (1 - f2) + Vector((-1.15, -1.35, 0.28)) * f2 + Vector((0, 0, -0.4 * f1 * (1 - f2))), basket=T(J, R, R0['wrL']) * (1 - f2) + Vector((0.95, -1.25, 0.42)) * f2 + Vector((0, 0, -0.5 * f1 * (1 - f2))), st_tip=(-0.1, -0.5, -0.85) if f2 < 0.5 else (0, -1, -0.2))
        legs(J, left=(0.5, 0.35, 0.2), right=(-0.5, 0.35, 0.2)); return J
    F.clip('idle', 48, idle); F.clip('walk', 40, walk); F.clip('windup', 36, windup); F.clip('attack', 28, attack); F.clip('hit', 10, hit); F.clip('shield', 16, shield); F.clip('death', 40, death)

def bind_all():
    bpy.context.view_layer.update()
    for (o, bones, blend) in BIND: F.bind(o, bones, blend)
{'huldra': build_huldra, 'nacken': build_nacken, 'draugr': build_draugr, 'troll_mor': build_troll_mor}[KIND]()
ad = F.rig.animation_data; ad.action = bpy.data.actions['idle']
if hasattr(ad, 'action_slot') and len(ad.action.slots): ad.action_slot = ad.action.slots[0]
sc.frame_set(1); os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, 'objects', len(BIND), 'bones', len(F.bones), 'actions', sorted(a.name for a in bpy.data.actions))
