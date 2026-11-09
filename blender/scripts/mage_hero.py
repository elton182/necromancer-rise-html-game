"""Mago jogável: corrige os pesos do rig Tripo e gera os clipes de jogo.

Uso, na raiz do projeto:
  blender --background --python blender/scripts/mage_hero.py [-- --review]
Pelo MCP, sobre um arquivo vazio: execute este arquivo; só remove objetos e ações marcados `mage_hero`.

Fonte: blender/reference/mage/mage_source.glb (rig Mixamo em pose A, cajado na mão direita).
O rig original prende o cajado ao antebraço e ao pé direito, a barba a um dedo da mão esquerda,
a aba do chapéu aos ombros e a barra do manto aos pés. Este script reatribui os pesos por região:
cajado e luva direita rígidos na mão direita, luva esquerda na mão esquerda, chapéu, rosto e barba
na cabeça, manto abaixo do quadril entre quadril e coxas; o restante mantém o peso original.
Clipes in-place a 30 fps: idle, walk, strafe_left, strafe_right, cast, cast_up, dodge, death.
"""
import sys as _asset_sys
from pathlib import Path as _AssetPath
_asset_sys.path.insert(0, str(_AssetPath(__file__).resolve().parent))
from asset_paths import asset_path

from pathlib import Path
import math
import sys
import bpy
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT = Path(__file__).resolve().parents[1]
REVIEW = '--review' in sys.argv
FPS = 30
CLIPS = [('idle', 61), ('walk', 21), ('strafe_left', 21), ('strafe_right', 21), ('cast', 16), ('cast_up', 22),
         ('dodge', 16), ('death', 31)]
STRIDE = 0.56
STRAFE_STRIDE = 0.44
if bpy.app.background:
    bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
for o in [o for o in scene.objects if o.get('mage_hero')]:
    bpy.data.objects.remove(o, do_unlink=True)
for a in [a for a in bpy.data.actions if a.get('mage_hero') and a.users == 0]:
    bpy.data.actions.remove(a)

before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=asset_path(str(ROOT / 'reference/mage/mage_source.glb')))
new = [o for o in bpy.data.objects if o not in before]
rig = next(o for o in new if o.type == 'ARMATURE')
mesh = max((o for o in new if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
for o in new:
    if o not in (rig, mesh):
        bpy.data.objects.remove(o, do_unlink=True)
rig.name, mesh.name = 'MageRig', 'MageBody'
for o in (rig, mesh):
    o['mage_hero'] = True


def rest(name):
    return rig.data.bones['mixamorig:' + name].head_local.copy()


# ---------------------------------------------------------------- pesos por região
HIP, HEAD = rest('Hips'), rest('Head')
CX, CY = HIP.x, HIP.y
group = {}


def g(name):
    full = 'mixamorig:' + name
    if full not in group:
        group[full] = mesh.vertex_groups.get(full) or mesh.vertex_groups.new(name=full)
    return group[full]


verts = mesh.data.vertices
# Eixo do cajado: reta ajustada aos vértices da haste abaixo da mão (à frente do corpo, lado direito).
shaft = [v.co for v in verts if v.co.x < CX - 0.2 and v.co.y < CY - 0.04 and v.co.z < 0.42]
n = len(shaft)
mz = sum(c.z for c in shaft) / n
mx = sum(c.x for c in shaft) / n
my = sum(c.y for c in shaft) / n
szz = sum((c.z - mz) ** 2 for c in shaft)
kx = sum((c.z - mz) * (c.x - mx) for c in shaft) / szz
ky = sum((c.z - mz) * (c.y - my) for c in shaft) / szz
axis = lambda z: Vector((mx + kx * (z - mz), my + ky * (z - mz), z))
R_HAND = rest('RightHand')
L_HAND = rest('LeftHand')


def region(co, head_weight=0.0):
    a = axis(co.z)
    d = math.hypot(co.x - a.x, co.y - a.y)
    # Haste fina; perto da mão e no cristal do topo, raio maior.
    if d < (0.12 if co.z > 0.7 else 0.05) and co.x < CX - 0.12 or co.z > 0.62 and co.x < CX - 0.2:
        return 'staff'
    if co.x < R_HAND.x + 0.05 and R_HAND.z - 0.2 < co.z < R_HAND.z + 0.03:
        return 'rglove'
    if co.x > L_HAND.x - 0.05 and co.z < L_HAND.z - 0.02 and co.z > 0.2:
        return 'lglove'
    r = math.hypot(co.x - CX, co.y - (HEAD.y - 0.01))
    # Aba do chapéu: cai até perto dos ombros nas bordas, mas fica além do raio deles.
    if (co.z > 0.72 and r < 0.38) or (co.z > 0.62 and 0.25 < r < 0.40) or (co.z > 0.66 and r < 0.10) or (co.z > 0.64 and head_weight >= 0.2):
        return 'head'
    if co.y < CY - 0.095 and 0.5 < co.z <= 0.72 and abs(co.x - CX) < 0.085:
        return 'beard'
    if co.z < HIP.z - 0.02:
        boot = co.z < 0.13 and min(abs(co.x - rest('LeftFoot').x), abs(co.x - rest('RightFoot').x)) < 0.07
        return 'boot' if boot else 'robe'
    return None


counts = {}
head_index = mesh.vertex_groups['mixamorig:Head'].index
for v in verts:
    kind = region(v.co, next((ge.weight for ge in v.groups if ge.group == head_index), 0.0))
    counts[kind] = counts.get(kind, 0) + 1
    if kind in (None, 'boot'):
        continue
    for ge in list(v.groups):
        mesh.vertex_groups[ge.group].remove([v.index])
    if kind in ('staff', 'rglove'):
        g('RightHand').add([v.index], 1, 'REPLACE')
    elif kind == 'lglove':
        g('LeftHand').add([v.index], 1, 'REPLACE')
    elif kind == 'head':
        g('Head').add([v.index], 1, 'REPLACE')
    elif kind == 'beard':
        k = max(0.0, min(1.0, (0.72 - v.co.z) / 0.22))
        g('Head').add([v.index], 1 - 0.45 * k, 'REPLACE')
        g('Spine2').add([v.index], 0.45 * k, 'REPLACE')
    else:  # manto: quadril e a coxa do lado, mais forte perto da barra
        s = max(-1.0, min(1.0, (v.co.x - CX) / 0.11))
        low = max(0.0, min(1.0, (HIP.z - v.co.z) / 0.3))
        side = abs(s) * (0.35 + 0.4 * low)
        g('Hips').add([v.index], 1 - side, 'REPLACE')
        g('LeftUpLeg' if s > 0 else 'RightUpLeg').add([v.index], side, 'REPLACE')
print('PESOS', {k: c for k, c in counts.items()}, 'eixo do cajado', round(kx, 3), round(ky, 3))

# Texturas menores e sem mapa normal: a câmera do jogo é distante.
for mat in mesh.data.materials:
    nodes = mat.node_tree.nodes
    for nd in list(nodes):
        if nd.type == 'NORMAL_MAP':
            nodes.remove(nd)
    for nd in list(nodes):
        if nd.type == 'TEX_IMAGE' and nd.image:
            if 'normal' in nd.image.name.lower():
                nodes.remove(nd)
                continue
            if nd.image.size[0] > 1024:
                nd.image.scale(1024, 1024)
                nd.image.pack()
    bsdf = next(nd for nd in nodes if nd.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = 0.85
    bsdf.inputs['Metallic'].default_value = 0.0

# ---------------------------------------------------------------- poses
bones = {b.name.split(':')[-1]: b for b in rig.pose.bones}
smooth = lambda t: t * t * (3 - 2 * t)
lerp = lambda a, b, t: a + (b - a) * t


def ease(points, t):
    for (t0, v0), (t1, v1) in zip(points, points[1:]):
        if t <= t1:
            u = 0 if t1 == t0 else smooth((t - t0) / (t1 - t0))
            return lerp(v0, v1, u)
    return points[-1][1]


def rot_world(key, angles):
    b = bones.get(key)
    if b:
        basis = b.bone.matrix_local.to_quaternion()
        b.rotation_quaternion = basis.inverted() @ Euler(angles).to_quaternion() @ basis


def aim_bones(upper, lower, root, target, pole):
    l1, l2 = upper.bone.length, lower.bone.length
    delta = target - root
    dist = min(delta.length, l1 + l2 - 0.0008)
    ax = delta.normalized()
    target = root + ax * dist
    along = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
    bend = pole - root
    normal = (bend - ax * bend.dot(ax)).normalized()
    mid = root + ax * along + normal * math.sqrt(max(0, l1 * l1 - along * along))
    for bone, head, tail in [(upper, root, mid), (lower, mid, target)]:
        q = (bone.bone.tail_local - bone.bone.head_local).rotation_difference(tail - head) @ bone.bone.matrix_local.to_quaternion()
        bone.matrix = Matrix.LocRotScale(head, q, Vector((1, 1, 1)))
        bpy.context.view_layer.update()
    return target


def arm(side, target, pole, hand_q=None):
    upper, lower, hand = bones[side + 'Arm'], bones[side + 'ForeArm'], bones[side + 'Hand']
    bpy.context.view_layer.update()
    end = aim_bones(upper, lower, upper.head.copy(), Vector(target), Vector(pole))
    if hand_q is None:
        hand_q = lower.matrix.to_quaternion() @ lower.bone.matrix_local.to_quaternion().inverted() @ hand.bone.matrix_local.to_quaternion()
    hand.matrix = Matrix.LocRotScale(end, hand_q, Vector((1, 1, 1)))
    bpy.context.view_layer.update()


def leg(side, target, pole):
    upper, lower, foot = bones[side + 'UpLeg'], bones[side + 'Leg'], bones[side + 'Foot']
    bpy.context.view_layer.update()
    end = aim_bones(upper, lower, upper.head.copy(), Vector(target), Vector(pole))
    foot.matrix = Matrix.LocRotScale(end, foot.bone.matrix_local.to_quaternion(), Vector((1, 1, 1)))
    bpy.context.view_layer.update()


H0 = rig.data.bones['mixamorig:RightHand'].matrix_local.to_quaternion()
FOOT = {s: rest(s + 'Foot') for s in ('Left', 'Right')}
SH = {s: rest(s + 'Arm') for s in ('Left', 'Right')}
HAND = {s: rest(s + 'Hand') for s in ('Left', 'Right')}


def gait(t, stride, direction):
    duty, feet = 0.56, {}
    for side, phase in (('Left', 0.0), ('Right', 0.5)):
        u = (t + phase) % 1
        if u < duty:
            s, z = 0.5 - u / duty, 0.0
        else:
            v = (u - duty) / (1 - duty)
            s, z = -0.5 + smooth(v), math.sin(v * math.pi) * 0.05
        d = s * stride * duty
        feet[side] = Vector((d * direction[0], d * direction[1], z))
    return feet, -0.01 + 0.01 * math.cos(t * 4 * math.pi)


def staff_q(pitch=0.0, roll=0.0):
    """Orientação da mão direita para o cajado inclinado (pitch leva o topo para a frente, -Y)."""
    return Euler((pitch, roll, 0)).to_quaternion() @ H0


def pose(name, t):
    breath = math.sin(t * math.tau)
    p = {'hip': Vector((0, 0, -0.02 + 0.005 * breath)), 'twist': 0.0, 'lean': 0.05, 'head': 0.0,
         'feet': {'Left': Vector((0.01, -0.02, 0)), 'Right': Vector((-0.01, 0.03, 0))},
         'right': HAND['Right'] + Vector((0, -0.02, 0.01 * breath)), 'staff': staff_q(0.05),
         'left': HAND['Left'] + Vector((-0.02, -0.02, 0.008 * breath))}
    if name in ('walk', 'strafe_left', 'strafe_right'):
        direction = {'walk': (0, -1), 'strafe_left': (1, 0), 'strafe_right': (-1, 0)}[name]
        feet, bob = gait(t, STRIDE if name == 'walk' else STRAFE_STRIDE, direction)
        sway = math.sin(t * math.tau)
        p.update(feet=feet, hip=Vector((0, 0, -0.03 + bob)), lean=0.08 if name == 'walk' else 0.05,
                 twist=0.08 * sway if name == 'walk' else 0.0)
        p['right'] = p['right'] + Vector((0, -0.03 * sway, 0))
        p['staff'] = staff_q(0.05 + 0.08 * sway)
        p['left'] = p['left'] + Vector((0, 0.05 * sway, 0))
    elif name == 'cast':
        # Aponta o cajado ao alvo e projeta a mão esquerda; disparo perto de 0.45 do clipe.
        up = ease([(0, 0), (0.35, 1), (0.6, 1), (1, 0)], t)
        push = ease([(0, 0), (0.38, 0), (0.46, 1), (0.7, 0.6), (1, 0)], t)
        p['right'] = lerp(p['right'], SH['Right'] + Vector((-0.02, -0.17 - 0.05 * push, -0.06)), up)
        p['staff'] = staff_q(0.05 + 1.05 * up)
        p['left'] = lerp(p['left'], SH['Left'] + Vector((-0.03, -0.20 - 0.04 * push, -0.08)), up)
        p['twist'], p['lean'] = 0.15 * up, 0.05 + 0.08 * push
        p['feet']['Left'] = Vector((0.02, -0.08 * up, 0))
        p['feet']['Right'] = Vector((-0.02, 0.07 * up, 0))
    elif name == 'cast_up':
        # Ergue o cajado acima da cabeça (Meteoro) e baixa apontando para o chão do alvo.
        up = ease([(0, 0), (0.35, 1), (0.55, 1), (0.7, 0.4), (1, 0)], t)
        slam = ease([(0, 0), (0.55, 0), (0.7, 1), (0.85, 1), (1, 0)], t)
        p['right'] = lerp(p['right'], Vector((SH['Right'].x + 0.02, CY - 0.06, HEAD.z + 0.06)), up)
        p['right'] = lerp(p['right'], SH['Right'] + Vector((0, -0.2, -0.12)), slam)
        p['staff'] = staff_q(0.05 - 0.15 * up + 1.3 * slam)
        p['left'] = lerp(p['left'], Vector((SH['Left'].x - 0.02, CY - 0.05, HEAD.z + 0.02)), up * (1 - slam))
        p['lean'] = 0.05 - 0.12 * up + 0.2 * slam
        p['head'] = -0.25 * up + 0.2 * slam
    elif name == 'dodge':
        roll = ease([(0, 0), (0.25, 1), (0.7, 1), (1, 0)], t)
        p['hip'] = Vector((0, 0, -0.02 - 0.15 * roll))
        p['lean'] = 0.05 + 0.9 * roll + 0.5 * math.sin(min(1, max(0, (t - 0.2) / 0.5)) * math.pi)
        p['feet']['Left'] = Vector((0.03, -0.09 * roll, 0))
        p['feet']['Right'] = Vector((-0.03, 0.09 * roll, 0.02 * roll))
        p['right'] = lerp(p['right'], HIP + Vector((-0.12, -0.18, -0.05)), roll)
        p['staff'] = staff_q(0.05 + 0.9 * roll)
        p['left'] = lerp(p['left'], HIP + Vector((0.14, -0.18, -0.05)), roll)
    elif name == 'death':
        fall = ease([(0, 0), (0.55, 1), (1, 1)], t)
        p['death'] = fall
        p['lean'] = 0.05 + 0.3 * fall
    return p


def apply(name, t):
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = (1, 0, 0, 0)
        b.location = (0, 0, 0)
    p = pose(name, t)
    death = p.get('death', 0)
    rot_world('Hips', (p['lean'] * .15, 0, p['twist'] * .4))
    rot_world('Spine', (p['lean'] * .3, 0, p['twist'] * .22))
    rot_world('Spine1', (p['lean'] * .3, 0, p['twist'] * .22))
    rot_world('Spine2', (p['lean'] * .25, 0, p['twist'] * .16))
    rot_world('Head', (-p['lean'] * .35 + p['head'], 0, -p['twist'] * .5))
    if death:
        rot_world('Hips', (-1.45 * death, 0.1 * death, -0.15 * death))
    bpy.context.view_layer.update()
    hips = bones['Hips']
    m = hips.matrix.copy()
    m.translation += p['hip'] + Vector((0, 0.1, -0.29)) * death
    hips.matrix = m
    bpy.context.view_layer.update()
    tf = hips.matrix @ hips.bone.matrix_local.inverted() if death else Matrix()
    for side in ('Left', 'Right'):
        target = FOOT[side] + (Vector((0, -0.1 * death, 0.02)) if death else p['feet'][side])
        leg(side, target, target + Vector((0, -0.25, 0.3)))
    q = tf.to_quaternion()
    right = tf @ p['right']
    left = tf @ p['left']
    arm('Right', right, right + Vector((-0.3, 0.25, -0.1)), q @ p['staff'])
    arm('Left', left, left + Vector((0.3, 0.25, -0.1)))


rig.animation_data_clear()
rig.animation_data_create()
for name, frames in CLIPS:
    action = bpy.data.actions.new(name)
    action['mage_hero'] = True
    rig.animation_data.action = action
    loop = name in ('idle', 'walk', 'strafe_left', 'strafe_right')
    for frame in range(1, frames + 1):
        scene.frame_set(frame)
        t = (frame - 1) / (frames - 1)
        apply(name, 0.0 if loop and frame == frames else t)
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
            b.keyframe_insert('location', frame=frame, group=b.name)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, action)
    track.mute = True
    rig.animation_data.action = None

# Origem entre os pés (o cajado não entra na conta), no chão.
rig.animation_data.action = bpy.data.actions['idle']
scene.frame_set(1)
bpy.context.view_layer.update()
ev = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
low = min((mesh.matrix_world @ v.co).z for v in ev.data.vertices)
feet = [(rig.matrix_world @ bones[s + 'Foot'].head) for s in ('Left', 'Right')]
anchor = Vector(((feet[0].x + feet[1].x) / 2, (feet[0].y + feet[1].y) / 2, low))
origin = bpy.data.objects.new('MageOrigin', None)
scene.collection.objects.link(origin)
origin['mage_hero'] = True
rig.parent = origin
rig.location = -anchor
rig.animation_data.action = None
for b in rig.pose.bones:
    b.rotation_quaternion = (1, 0, 0, 0)
    b.location = (0, 0, 0)

mesh.data.calc_loop_triangles()
print('MALHA', len(mesh.data.loop_triangles), 'triângulos')
for tr in rig.animation_data.nla_tracks:
    tr.mute = False
bpy.ops.object.select_all(action='DESELECT')
for o in (origin, rig, mesh):
    o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=asset_path(str(ROOT / 'exports/mage_hero.glb')), use_selection=True, export_format='GLB',
                          export_animations=True, export_animation_mode='NLA_TRACKS', export_image_format='JPEG', export_image_quality=82)
for tr in rig.animation_data.nla_tracks:
    tr.mute = True
rig.animation_data.action = bpy.data.actions['idle']
scene.frame_start, scene.frame_end = 1, 61
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=asset_path(str(ROOT / 'models/mage_hero.blend')))
print('Mago:', len(CLIPS), 'clipes exportados para exports/mage_hero.glb')
