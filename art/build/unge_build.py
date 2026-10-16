"""Hårungen, the cave troll's young, built for the game (2026-10-16; Robin picked B1 of the second concept board: the troll
child with a shaggy mop of hair to the shoulders, the rest of him bare). Half the hero's height (0.9 units; the game draws the
hero and the cave troll at 79 px a unit). The body is sculpted from a radius-skeleton (skin.py), rigged and posed by its joints
(figure.py), the clips baked from functions of the phase, as the redesigned väsen are (vasen_build.py).
   node tools/blender.js unge_build.py            (writes ../source/troll_unge.blend)

  the look   a big head, the family's drooping nose past the chin, small yellow eyes under two scowling brows, big drooping
             ears, a mop of hair in clumps from the crown to the shoulders with three heavy locks over the brow; a pale
             potbelly, short arms, big flat feet, a cow's tail dragging behind; three pebbles and a tooth on a string; a
             gnawed bone in his left fist
  the clips  idle (he gnaws the bone, looks about, the tail twitches), walk (a waddle, rolling from foot to foot, the tail
             dragging), run (a scurry, leaning in, arms out), windup (the bone raised overhead: the tell), attack (the bonk,
             a hop forward and down), hit (a flinch), death (onto his knees, then forward onto his face)"""
import bpy, math, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from skin import Stick, ball
from figure import Figure, R3, ease, ik2
from mathutils import Vector, Matrix

KIND = 'troll_unge'
SRC = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')); OUT = os.path.join(SRC, KIND + '.blend')
rad = math.radians; TAU = 2 * math.pi; FPS = 24
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS
coll = bpy.data.collections.new('Body'); sc.collection.children.link(coll); gear = bpy.data.collections.new('Gear'); sc.collection.children.link(gear)
C = {}; BIND = []
def mats(d):
    for k, v in d.items(): C[k] = toon.material('c_' + k, v, None, 'cel')
def use(o, bones=None, blend=0.03): BIND.append((o, bones, blend)); return o
def B(name, mat, c, r, sx=1.0, sy=1.0, sz=1.0, rot=None, bones=None, seg=14, rings=10): return use(ball(name, coll, C[mat], c, r, sx, sy, sz, seg, rings, rot=rot), bones)
def hang(name, pts, length, r0, r1, mat, lean=0.0, sway=0.0, seg=3, back=None, bones=None, blend=0.03):
    S = Stick(); rng = random.Random(len(pts))
    for k, p in enumerate(pts):
        p = Vector(p); o = Vector((p.x, p.y, 0)); o = o.normalized() * lean if o.length > 0.01 else Vector()
        if back is not None: o = Vector(back) * lean
        L = length * rng.uniform(0.8, 1.15)
        S.chain([p + (o + Vector((0, 0, -L))) * (j / seg) + Vector((sway * math.sin(j * 1.3 + k), sway * math.cos(j * 0.9 + k), 0)) * (j > 0) for j in range(seg + 1)], (r0, r1), None, mat)
    return use(S.build(name, coll, C, subdiv=1), bones, blend)
def fingers(S, hand, base, fwd, side, n, length, r, down=0.04, nail_bones=None):
    for i in range(n):
        o = (i - (n - 1) / 2) * r * 2.1
        a = Vector(base) + Vector(side) * o; b = a + Vector(fwd) * length * 0.55 - Vector((0, 0, down * 0.4)); c = a + Vector(fwd) * length - Vector((0, 0, down))
        S.chain([a, b, c], (r, r * 0.8), hand, 'skin'); B('nail', 'nail', c + Vector(fwd) * r * 0.5, r * 0.75, 1.0, 1.0, 0.7, bones=nail_bones)
def clump(p, n, t, r, long=1.6, thin=0.55, wide=0.85, bones=('head',)):
    n = Vector(n).normalized(); t = Vector(t); t = (t - n * t.dot(n)); t = t.normalized() if t.length > 1e-4 else n.orthogonal().normalized(); sd = t.cross(n)
    B('clump', 'hair', p, r, wide, long, thin, rot=Matrix((sd, t, n)).transposed(), seg=10, rings=7, bones=list(bones))
def clumps(hc, R, n, seed, face=55, face_top=0.55, el=(-0.1, 1.0), size=(0.05, 0.08), long=1.6):
    """a head of hair as clumps lying on a sphere round hc, each falling down the surface, none over the face (the concept's)"""
    rng = random.Random(seed); k = 0; tries = 0
    while k < n and tries < n * 30:
        tries += 1; az = rng.uniform(-180, 180); z = rng.uniform(*el)
        if abs(az) < face and z < face_top: continue
        c = math.sqrt(max(0.0, 1 - z * z)); d = Vector((math.sin(rad(az)) * c, -math.cos(rad(az)) * c, z))
        clump(Vector(hc) + d * R, d, Vector((0, 0, -1)) + Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), 0)), rng.uniform(*size), long * rng.uniform(0.85, 1.2)); k += 1
def sn(p, f=1.0, o=0.0): return math.sin(TAU * (p * f + o))
F = Figure(KIND); J0 = F.joint

mats({'skin': '#9e8e74', 'belly': '#b4a58a', 'dark': '#4a4036', 'hair': '#4f4336', 'nose': '#ae9378', 'eye': '#f4b63a', 'mouth': '#3a1c18', 'tooth': '#e6dcc0', 'nail': '#3a3028',
      'stone': '#8e887a', 'bone': '#ddd2b6', 'bead': '#c05a30'})
# ---- the joints, in the concept's pose (the bone held in front)
P = {'hips': (0, 0.03, 0.24), 'chest': (0, -0.01, 0.50), 'neck': (0, -0.03, 0.58), 'headb': (0, -0.03, 0.60), 'headt': (0, -0.04, 0.86),
     'shL': (0.15, -0.02, 0.50), 'elL': (0.21, -0.17, 0.39), 'wrL': (0.12, -0.31, 0.36), 'haL': (0.08, -0.40, 0.35),
     'shR': (-0.15, -0.02, 0.50), 'elR': (-0.21, -0.17, 0.39), 'wrR': (-0.12, -0.31, 0.36), 'haR': (-0.08, -0.40, 0.35),
     'hipL': (0.10, 0.03, 0.20), 'knL': (0.13, -0.03, 0.11), 'anL': (0.12, 0.0, 0.05), 'toL': (0.13, -0.22, 0.03),
     'hipR': (-0.10, 0.03, 0.20), 'knR': (-0.13, -0.03, 0.11), 'anR': (-0.12, 0.0, 0.05), 'toR': (-0.13, -0.22, 0.03),
     'ta0': (0, 0.17, 0.22), 'ta1': (0.04, 0.31, 0.11), 'ta2': (0.10, 0.42, 0.05), 'ta3': (0.16, 0.50, 0.07)}
for n, p in P.items(): J0(n, p)
F.bone('hips', 'hips', 'chest'); F.bone('chest', 'chest', 'neck', 'hips'); F.bone('neck', 'neck', 'headb', 'chest'); F.bone('head', 'headb', 'headt', 'neck')
for s, sx in (('L', 1), ('R', -1)):
    F.bone('up' + s, 'sh' + s, 'el' + s, 'chest', (sx, 0, 0)); F.bone('lo' + s, 'el' + s, 'wr' + s, 'up' + s, (sx, 0, 0)); F.bone('ha' + s, 'wr' + s, 'ha' + s, 'lo' + s, (sx, 0, 0))
    F.bone('th' + s, 'hip' + s, 'kn' + s, 'hips', (sx, 0, 0)); F.bone('sh' + s, 'kn' + s, 'an' + s, 'th' + s, (sx, 0, 0)); F.bone('ft' + s, 'an' + s, 'to' + s, 'sh' + s, (sx, 0, 0))
EYE = {'L': Vector((0.058, -0.186, 0.71)), 'R': Vector((-0.058, -0.186, 0.71))}     # the eyes (as the face below places them)
for s_ in ('L', 'R'): J0('ey0' + s_, EYE[s_] + Vector((0, 0.04, 0))); J0('ey1' + s_, EYE[s_]); F.bone('eye.' + s_, 'ey0' + s_, 'ey1' + s_, 'head', (0, 0, 1))
F.bone('tailA', 'ta0', 'ta1', 'hips', (0, 0, 1)); F.bone('tailB', 'ta1', 'ta2', 'tailA', (0, 0, 1)); F.bone('tailC', 'ta2', 'ta3', 'tailB', (0, 0, 1))
# ---- the body (the concept's B1)
S = Stick(); j = F.J
hips = S.add(j['hips'], (0.18, 0.16)); belly = S.add((0, -0.04, 0.36), (0.22, 0.21), hips, 'belly'); chest = S.add(j['chest'], (0.16, 0.14), belly)
neck = S.add(j['neck'], 0.09, chest)
for s, sx in (('L', 1), ('R', -1)):
    sh = S.add(j['sh' + s], 0.065, chest); el = S.add(j['el' + s], 0.055, sh); wr = S.add(j['wr' + s], 0.05, el)
    hd = S.add((sx * 0.09, -0.34, 0.36), (0.06, 0.055), wr); fingers(S, hd, (sx * 0.08, -0.37, 0.35), (-sx * 0.3, -1, -0.3), (0, 0, 1), 3, 0.05, 0.018, 0.02, nail_bones=['ha' + s])
    hp = S.add(j['hip' + s], 0.075, hips); kn = S.add(j['kn' + s], 0.065, hp); an = S.add(j['an' + s], 0.055, kn)
    ft = S.add((sx * 0.13, -0.10, 0.035), (0.08, 0.125), an); fingers(S, ft, (sx * 0.13, -0.21, 0.03), (sx * 0.15, -1, 0), (1, 0, 0), 3, 0.05, 0.026, 0.0, nail_bones=['ft' + s])
use(S.build('body', coll, C))
St = Stick(); St.chain([j['ta0'], j['ta1'], j['ta2'], j['ta3']], [0.048, 0.04, 0.034, 0.03], None, 'skin'); use(St.build('tail', coll, C), ['tailA', 'tailB', 'tailC'], 0.04)
for d in (-1, 1): clump(j['ta3'] + Vector((0.02 * d, 0.04, 0.0)), Vector((d * 0.6, 0.3, 1)), Vector((0.4, 1, -0.6)), 0.045, 1.6, 0.6, bones=('tailC',))
# ---- the head and face
hc = Vector((0, -0.04, 0.69)); HB = ['head']
B('head', 'skin', hc, 0.17, 1.05, 1.0, 0.95, bones=HB)
fwd = Vector((0, -1, 0)); up = Vector((0, 0, 1)); side = fwd.cross(up).normalized(); R = 0.17
ep = [hc + fwd * R * 0.86 + side * s * R * 0.34 + up * R * 0.12 for s in (1, -1)]
for k, e in enumerate(ep):
    sg = 1 if k == 0 else -1
    B('socket', 'dark', e - fwd * 0.004, 0.02 * 1.9, 1.0, 0.55, 0.8, bones=HB); B('eye', 'eye', e + fwd * 0.008, 0.02, bones=HB)
    B('brow', 'hair', e + up * R * 0.15 - fwd * R * 0.02 - side * sg * R * 0.04, R * 0.17, 1.55, 0.85, 0.62, rot=Matrix.Rotation(rad(sg * 20), 3, fwd), bones=HB)
Sn = Stick(); npts = [Vector((0, -0.15, 0.01)), Vector((0, -0.25, -0.05)), Vector((0, -0.29, -0.14)), Vector((0.008, -0.28, -0.20))]; nr = [0.045, 0.04, 0.034, 0.05]
Sn.chain([hc + p for p in npts], nr, None, 'nose'); use(Sn.build('nose', coll, C), HB)
tip = hc + npts[-1]; B('wart', 'dark', tip + side * nr[-1] * 0.7 + up * nr[-1] * 0.6 - fwd * nr[-1] * 0.2, nr[-1] * 0.32, bones=HB)
B('mouth', 'mouth', hc + fwd * R * 0.82 + up * R * -0.50, R * 0.42, 1.25, 0.45, 0.28, bones=HB); B('tooth', 'tooth', hc + fwd * R * 0.93 + up * R * -0.52 + side * R * 0.22, R * 0.07, 1.0, 1.0, 2.0, bones=HB)
for sx in (1, -1): B('ear', 'skin', hc + Vector((sx * 0.20, 0.01, -0.04)), 0.09, 0.38, 0.75, 1.25, rot=Matrix.Rotation(rad(sx * 48), 3, 'Y'), bones=HB)
# ---- the mop
clumps(hc, 0.175, 46, 21, face=58, face_top=0.5, el=(-0.15, 1.0), size=(0.055, 0.085), long=1.7)
clumps(hc + Vector((0, 0.03, -0.11)), 0.17, 22, 22, face=80, face_top=0.6, el=(-0.45, 0.35), size=(0.05, 0.075), long=1.9)
for i, (x, dx) in enumerate([(-0.07, -0.02), (-0.01, 0.01), (0.06, 0.05)]):
    clump(hc + Vector((x, -0.135 + abs(x) * 0.2, 0.115 - abs(x) * 0.25)), Vector((x * 2, -1, 0.45)), Vector((0.35, -0.1, -1)), 0.05, 1.9, 0.5)
# ---- the pebbles and the bone
for i, (x, z, m) in enumerate([(-0.07, 0.49, 'stone'), (-0.025, 0.475, 'bead'), (0.025, 0.475, 'stone'), (0.07, 0.49, 'tooth')]):
    B('pebble', m, (x, -0.19 - 0.01 * (1 - abs(x) * 10), z), 0.022 if m != 'tooth' else 0.016, 1.0, 1.0, 1.0 if m != 'tooth' else 1.8, bones=['chest'])
Sb = Stick(); Sb.chain([(0.11, -0.38, 0.47), (0.12, -0.39, 0.36), (0.14, -0.40, 0.25)], (0.02, 0.018), None, 'bone'); use(Sb.build('bone', coll, C, subdiv=1), ['haL'])
for z in (0.48, 0.24): B('boneknob', 'bone', (0.11 if z > 0.3 else 0.14, -0.385, z), 0.032, 1.3, 1.0, 0.9, bones=['haL'])

F.build_rig(sc); F.rig['marks'] = 'eye.L,eye.R'      # the night glow's points (as troll_build.py's marks)
bpy.context.view_layer.update()
for (o, bones, blend) in BIND: F.bind(o, bones, blend)
R0 = F.R0

# ---- posing helpers
def base(): return {k: v.copy() for k, v in R0.items()}
def torso(J, hips=None, yaw=0.0, pitch=0.0, roll=0.0):
    Rm = R3(yaw, pitch, roll); J['hips'] = Vector(hips) if hips is not None else R0['hips'].copy()
    for n in ('chest', 'neck', 'headb', 'headt', 'shL', 'shR', 'hipL', 'hipR', 'ta0'): J[n] = J['hips'] + Rm @ (R0[n] - R0['hips'])
    return Rm
def headpose(J, Rm, pitch=0.0, yaw=0.0, roll=0.0):
    Rh = Rm @ R3(yaw, pitch, roll)
    for n in ('headt', 'ey0L', 'ey1L', 'ey0R', 'ey1R'): J[n] = J['headb'] + Rh @ (R0[n] - R0['headb'])
def T(J, Rm, p): return J['hips'] + Rm @ (Vector(p) - R0['hips'])
def arm(J, s, wrist, bend, tip=None):
    sh = J['sh' + s]; l1 = (R0['el' + s] - R0['sh' + s]).length; l2 = (R0['wr' + s] - R0['el' + s]).length; l3 = (R0['ha' + s] - R0['wr' + s]).length
    el, wr = ik2(sh, wrist, l1, l2, bend); J['el' + s] = el; J['wr' + s] = wr
    d = Vector(tip) if tip is not None else (wr - el); J['ha' + s] = wr + d.normalized() * l3
def leg(J, s, ankle, toe=(0, -1, -0.1), bend=(0, -1, 0)):
    hip = J['hip' + s]; l1 = (R0['kn' + s] - R0['hip' + s]).length; l2 = (R0['an' + s] - R0['kn' + s]).length; l3 = (R0['to' + s] - R0['an' + s]).length
    kn, an = ik2(hip, ankle, l1, l2, bend); J['kn' + s] = kn; J['an' + s] = an; J['to' + s] = an + Vector(toe).normalized() * l3
def tail(J, Rm, swing=0.0, lift=0.0):
    """the tail follows the hips and drags: each joint carried with the torso, swung sideways more toward the tip, lifted a little, never below the ground"""
    for k, n in enumerate(('ta1', 'ta2', 'ta3')):
        f = (k + 1) / 3; p = T(J, Rm, R0[n]) + Vector((swing * f, 0, lift * f)); p.z = max(0.02, min(p.z, R0[n].z + 0.12 + lift)); J[n] = p
def hands_rest(J, Rm):
    arm(J, 'L', T(J, Rm, R0['wrL']), (1, 0.4, -0.3), tip=Rm @ (R0['haL'] - R0['wrL'])); arm(J, 'R', T(J, Rm, R0['wrR']), (-1, 0.4, -0.3), tip=Rm @ (R0['haR'] - R0['wrR']))
def step(u, S, h, beta, y0, z0, x):
    u = u % 1.0
    if u < beta: return Vector((x, y0 - S / 2 + S * (u / beta), z0))
    v = (u - beta) / (1 - beta); e = 0.5 - 0.5 * math.cos(math.pi * v); return Vector((x, y0 + S / 2 - S * e, z0 + h * math.sin(math.pi * v)))
AN = {s: R0['an' + s] for s in ('L', 'R')}

def idle(p):
    """he gnaws the bone: both fists come up to the mouth twice and down, the head bites down and looks about, the belly breathes, the tail twitches"""
    g = 0.5 - 0.5 * math.cos(TAU * 2 * p); g = g * g
    J = base(); Rm = torso(J, hips=(0, 0.03, 0.24 + 0.004 * sn(p, 2)), yaw=6 * sn(p, 0.5), pitch=4 * g, roll=2 * sn(p))
    headpose(J, Rm, 10 * g - 4, 14 * sn(p, 0.5, 0.15) * (1 - g), 3 * sn(p, 1, 0.3))
    arm(J, 'L', T(J, Rm, R0['wrL']).lerp(T(J, Rm, (0.07, -0.23, 0.52)), g), (1, 0.4, -0.3), tip=(Rm @ (R0['haL'] - R0['wrL'])).lerp(Vector((-0.2, -0.6, 0.6)), g))
    arm(J, 'R', T(J, Rm, R0['wrR']).lerp(T(J, Rm, (-0.05, -0.25, 0.48)), g), (-1, 0.4, -0.3), tip=(Rm @ (R0['haR'] - R0['wrR'])).lerp(Vector((0.3, -0.6, 0.5)), g))
    leg(J, 'L', AN['L']); leg(J, 'R', AN['R']); tail(J, Rm, 0.05 * sn(p, 1.5) + 0.03 * sn(p, 4)); return J
def walk(p):
    """a waddle: short steps on a wide stance, rolling from foot to foot, the bone held in front, the tail dragging side to side"""
    fl = step(p, 0.13, 0.05, 0.6, -0.02, 0.05, 0.13); fr = step(p + 0.5, 0.13, 0.05, 0.6, -0.02, 0.05, -0.13); heave = 0.5 + 0.5 * math.cos(TAU * 2 * p)
    J = base(); Rm = torso(J, hips=(0.025 * sn(p, 1, 0.25), 0.03, 0.24 + 0.016 * heave), yaw=-5 * sn(p), pitch=5, roll=-11 * sn(p, 1, 0.25))
    headpose(J, Rm, 2 + 3 * sn(p, 2), 4 * sn(p), 9 * sn(p, 1, 0.25)); hands_rest(J, Rm)
    J['wrL'] = J['wrL'] + Vector((0, 0, 0.012 * sn(p, 2))); leg(J, 'L', fl); leg(J, 'R', fr); tail(J, Rm, 0.07 * sn(p, 1, 0.1)); return J
def run(p):
    """a scurry: leaning in, bigger quicker steps with a hop, the arms out for balance, the bone waving"""
    fl = step(p, 0.24, 0.09, 0.45, -0.04, 0.05, 0.12); fr = step(p + 0.5, 0.24, 0.09, 0.45, -0.04, 0.05, -0.12); hop = abs(sn(p, 1, 0.12))
    J = base(); Rm = torso(J, hips=(0.02 * sn(p, 1, 0.25), 0.03, 0.235 + 0.035 * hop), yaw=-8 * sn(p), pitch=18, roll=-9 * sn(p, 1, 0.25)); headpose(J, Rm, -10 + 4 * sn(p, 2), 6 * sn(p), 6 * sn(p, 1, 0.25))
    arm(J, 'L', T(J, Rm, (0.27, -0.12, 0.44 + 0.05 * sn(p))), (0.6, 0.6, -0.4), tip=(0.4, -0.5, 0.5)); arm(J, 'R', T(J, Rm, (-0.27, -0.12, 0.44 - 0.05 * sn(p))), (-0.6, 0.6, -0.4), tip=(-0.4, -0.6, 0.2))
    leg(J, 'L', fl); leg(J, 'R', fr); tail(J, Rm, 0.06 * sn(p, 1, 0.1), 0.04 * hop); return J
def windup(p):
    """the tell: he rears back and raises the bone overhead in his left fist, the other arm out, and holds it shaking"""
    k = ease(min(1.0, p * 1.4)); t = 1.5 * sn(p, 6) * k
    J = base(); Rm = torso(J, hips=(0, 0.03 + 0.02 * k, 0.24), yaw=-10 * k, pitch=-12 * k + t, roll=5 * k); headpose(J, Rm, -14 * k, 6 * k, 0)
    arm(J, 'L', T(J, Rm, R0['wrL']).lerp(T(J, Rm, (0.12, 0.04, 0.82)), k), (1, 0.5, 0), tip=(Rm @ (R0['haL'] - R0['wrL'])).lerp(Vector((0.05, 0.3, 1)), k))
    arm(J, 'R', T(J, Rm, R0['wrR']).lerp(T(J, Rm, (-0.26, -0.12, 0.42)), k), (-1, 0.3, -0.2), tip=(-0.6, -0.5, 0.0))
    leg(J, 'L', AN['L'] + Vector((0, 0.04 * k, 0))); leg(J, 'R', AN['R'] + Vector((0, -0.05 * k, 0))); tail(J, Rm, 0.03 * sn(p, 3) * k, 0.05 * k); return J
def attack(p):
    """the bonk: a hop forward and the bone brought down hard in front, then back to the stance"""
    a = ease(min(1.0, p / 0.35)); back = ease(max(0.0, (p - 0.55) / 0.45)); hold = a * (1 - back); hop = math.sin(math.pi * min(1.0, p / 0.45)) * (1 - back)
    up_ = 1 - a
    J = base(); Rm = torso(J, hips=(0, 0.03 + 0.02 * up_ - 0.07 * hold, 0.24 + 0.04 * hop - 0.02 * hold), yaw=-10 * up_ + 8 * hold, pitch=-12 * up_ + 26 * hold, roll=5 * up_); headpose(J, Rm, -14 * up_ + 10 * hold, 6 * up_, 0)
    wr = T(J, Rm, (0.12, 0.04, 0.82)) * up_ + T(J, Rm, (0.06, -0.40, 0.20)) * hold + T(J, Rm, R0['wrL']) * back
    tp = Vector((0.05, 0.3, 1)) * up_ + Vector((0, -0.6, -0.8)) * hold + (Rm @ (R0['haL'] - R0['wrL'])) * back
    arm(J, 'L', wr, (1, 0.5, 0), tip=tp); arm(J, 'R', T(J, Rm, (-0.26, -0.12, 0.42)) * (1 - back) + T(J, Rm, R0['wrR']) * back, (-1, 0.3, -0.2), tip=(-0.6, -0.5, 0.0))
    leg(J, 'L', AN['L'] + Vector((0, -0.06 * hold, 0.03 * hop))); leg(J, 'R', AN['R'] + Vector((0, 0.02 * hold, 0.03 * hop))); tail(J, Rm, 0.04 * hold, 0.06 * hop); return J
def hit(p):
    k = math.sin(math.pi * p); J = base(); Rm = torso(J, hips=(0, 0.03 + 0.04 * k, 0.24 - 0.01 * k), yaw=10 * k, pitch=-14 * k, roll=7 * k); headpose(J, Rm, -14 * k, 18 * k, 8 * k)
    arm(J, 'L', T(J, Rm, R0['wrL']) + Vector((0.05 * k, 0.04 * k, 0.06 * k)), (1, 0.4, -0.3)); arm(J, 'R', T(J, Rm, R0['wrR']) + Vector((-0.06 * k, 0.03 * k, 0.07 * k)), (-1, 0.4, -0.3))
    leg(J, 'L', AN['L']); leg(J, 'R', AN['R']); tail(J, Rm, 0.06 * k, 0.05 * k); return J
def death(p):
    """onto his knees, then forward onto his face, the bone still in his fist, the tail flat"""
    f1 = ease(min(1.0, p / 0.4)); f2 = ease(min(1.0, max(0.0, (p - 0.35) / 0.45))); settle = 0.008 * math.sin(math.pi * min(1.0, max(0.0, (p - 0.82) / 0.18)))
    J = base(); Rm = torso(J, hips=(0, 0.03 + 0.06 * f1 - 0.02 * f2, 0.24 - 0.07 * f1 - 0.03 * f2 + settle), yaw=-4 * f1, pitch=10 * f1 + 62 * f2, roll=4 * f1); headpose(J, Rm, 10 * f1 + 16 * f2, 12 * f1, 8 * f2)
    arm(J, 'L', T(J, Rm, R0['wrL']) * (1 - f2) + Vector((0.20, -0.42, 0.06)) * f2, (1, 0.3, 0.2), tip=(0, -1, -0.3) if f2 > 0.5 else None)
    arm(J, 'R', T(J, Rm, R0['wrR']) * (1 - f2) + Vector((-0.22, -0.40, 0.06)) * f2, (-1, 0.3, 0.2), tip=(0, -1, -0.3) if f2 > 0.5 else None)
    for s_, sx in (('L', 1), ('R', -1)):
        knee_down = Vector((0, -1, 0)).lerp(Vector((0, 0.2, -1)), f2)
        leg(J, s_, Vector((sx * 0.13, 0.12 * f1 + 0.20 * f2, 0.05 - 0.01 * f2)), toe=Vector((0, -1, -0.1)).lerp(Vector((0, 1, -0.15)), f1), bend=knee_down)
    tail(J, Rm, 0.03 * f2, -0.02 * f2)
    for k, n in enumerate(('ta1', 'ta2', 'ta3')):              # the tail falls along the ground
        f = (k + 1) / 3; J[n] = J[n].lerp(J['ta0'] + Vector((0.05 * f, 0.30 * f, 0)) + Vector((0, 0, -J['ta0'].z + 0.03)) * min(1.0, f * 1.6), f2)
    return J

F.clip('idle', 48, idle); F.clip('walk', 32, walk); F.clip('run', 20, run); F.clip('windup', 24, windup); F.clip('attack', 20, attack); F.clip('hit', 10, hit); F.clip('death', 32, death)
ad = F.rig.animation_data; ad.action = bpy.data.actions['idle']
if hasattr(ad, 'action_slot') and len(ad.action.slots): ad.action_slot = ad.action.slots[0]
sc.frame_set(1); os.makedirs(SRC, exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT)
print('saved', OUT, 'objects', len(BIND), 'bones', len(F.bones), 'actions', sorted(a.name for a in bpy.data.actions))
