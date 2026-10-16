"""A rig for a sculpted body, posed by its joints (2026-10-14, the studio). A figure is a set of named joints in a rest pose
and bones between them. A clip is a function of the phase that returns where every joint is; each bone is then aimed from
its parent joint at its child joint (its Y along the bone, its Z toward a fixed hint so the twist is steady), parents first,
and keyed. So a pose is written as positions, with small helpers for the torso's turn, two-bone limbs (IK) and a head's tilt,
and no axis is ever guessed. Meshes are bound by the nearest bone with a blend at the joints."""
import bpy, math
from mathutils import Vector, Matrix

rad = math.radians
RX = lambda d: Matrix.Rotation(rad(d), 3, 'X'); RY = lambda d: Matrix.Rotation(rad(d), 3, 'Y'); RZ = lambda d: Matrix.Rotation(rad(d), 3, 'Z')
def R3(yaw=0.0, pitch=0.0, roll=0.0): return RZ(yaw) @ RX(pitch) @ RY(roll)      # a figure facing -Y: positive pitch leans it forward
def ease(k): k = max(0.0, min(1.0, k)); return k * k * (3 - 2 * k)
def ik2(a, t, l1, l2, bend):
    """the middle joint of a two-bone limb from a to the target t, bending toward bend; returns (middle, end reached)"""
    a = Vector(a); d = Vector(t) - a; L = d.length; L = max(abs(l1 - l2) + 1e-3, min(l1 + l2 - 1e-3, L)); dn = d.normalized() if d.length > 1e-6 else Vector((0, 0, -1))
    b = Vector(bend); b = b - dn * b.dot(dn); b = b.normalized() if b.length > 1e-4 else (Vector((0, 0, 1)) - dn * dn.z).normalized()
    ca = max(-1.0, min(1.0, (l1 * l1 + L * L - l2 * l2) / (2 * l1 * L))); sa = math.sqrt(max(0.0, 1 - ca * ca))
    return a + dn * (l1 * ca) + b * (l1 * sa), a + dn * L

class Figure:
    def __init__(self, name):
        self.name = name; self.J = {}; self.bones = []; self.hint = {}; self.rig = None
    def joint(self, n, p): self.J[n] = Vector(p); return self.J[n]
    def bone(self, name, a, b, parent=None, hint=(0, -1, 0)):
        self.bones.append((name, a, b, parent)); self.hint[name] = Vector(hint).normalized()
    @staticmethod
    def _up(d, hint):
        d = d.normalized(); u = hint - d * hint.dot(d)
        if u.length < 0.08:
            alt = Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 0, 1)); u = alt - d * alt.dot(d)
        return u.normalized()
    def build_rig(self, scene):
        arm = bpy.data.armatures.new(self.name + 'Rig'); rig = bpy.data.objects.new(self.name + 'Rig', arm); scene.collection.objects.link(rig)
        bpy.context.view_layer.objects.active = rig; rig.select_set(True); bpy.ops.object.mode_set(mode='EDIT'); EB = arm.edit_bones
        self.rest = {}
        for (n, a, b, par) in self.bones:
            eb = EB.new(n); eb.head = self.J[a]; eb.tail = self.J[b]
            if par: eb.parent = EB[par]
            d = (self.J[b] - self.J[a]).normalized(); up = self._up(d, self.hint[n]); eb.align_roll(up); self.rest[n] = (d, up)
        bpy.ops.object.mode_set(mode='OBJECT')
        for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'
        self.rig = rig; self.R0 = {k: v.copy() for k, v in self.J.items()}
        return rig
    def frame_matrix(self, n, a, b, J):
        """the bone's frame in the pose: Y along the bone; Z the rest pose's up carried by the smallest turn that takes the rest
        direction to the new one (a fixed world hint degenerated when a bone swung parallel to it, 2026-10-14: a falling trunk
        rolled a quarter turn and the roots swung out)"""
        d = J[b] - J[a]; dn = d.normalized(); d0, up0 = self.rest[n]
        z = (d0.rotation_difference(dn).to_matrix() @ up0); z = z - dn * z.dot(dn)
        z = z.normalized() if z.length > 1e-4 else self._up(dn, self.hint[n]); x = dn.cross(z); p = J[a]
        return Matrix(((x.x, dn.x, z.x, p.x), (x.y, dn.y, z.y, p.y), (x.z, dn.z, z.z, p.z), (0, 0, 0, 1)))
    def pose(self, J, frame):
        rig = self.rig
        for (n, a, b, par) in self.bones:
            pb = rig.pose.bones[n]; pb.matrix = self.frame_matrix(n, a, b, J); bpy.context.view_layer.update()
        for (n, a, b, par) in self.bones:
            pb = rig.pose.bones[n]; pb.keyframe_insert('location', frame=frame); pb.keyframe_insert('rotation_quaternion', frame=frame)
    def clip(self, name, length, fn):
        act = bpy.data.actions.new(name); act.use_fake_user = True; act.use_frame_range = True; act.frame_start = 1; act.frame_end = length
        ad = self.rig.animation_data or self.rig.animation_data_create(); ad.action = act
        if hasattr(ad, 'action_slot') and len(act.slots): ad.action_slot = act.slots[0]
        for f in range(1, length + 1): self.pose(fn((f - 1) / length), f)
        return act
    def bind(self, o, bones=None, blend=0.06):
        """vertex groups by the nearest bone segment, the two nearest blended where they are nearly as near"""
        bones = bones or [n for (n, a, b, par) in self.bones]; segs = [(n, self.J[a], self.J[b]) for (n, a, b, par) in self.bones if n in bones]
        groups = {n: o.vertex_groups.new(name=n) for n in bones}; M = o.matrix_world.copy()
        for v in o.data.vertices:
            p = M @ v.co; ds = []
            for (n, a, b) in segs:
                d = b - a; L2 = d.length_squared; t = 0.0 if L2 < 1e-9 else max(0.0, min(1.0, (p - a).dot(d) / L2)); ds.append(((p - (a + d * t)).length, n))
            ds.sort()
            if len(ds) > 1 and ds[1][0] - ds[0][0] < blend:
                w = 0.5 + 0.5 * (ds[1][0] - ds[0][0]) / blend; groups[ds[0][1]].add([v.index], w, 'REPLACE'); groups[ds[1][1]].add([v.index], 1 - w, 'REPLACE')
            else: groups[ds[0][1]].add([v.index], 1.0, 'REPLACE')
        md = o.modifiers.new('rig', 'ARMATURE'); md.object = self.rig; o.parent = self.rig
    def attach(self, o):
        """a thing that does not bend: parented to the rig only (a rock the figure sits on)"""
        o.parent = self.rig
