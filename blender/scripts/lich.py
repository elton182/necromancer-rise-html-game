"""Lich da Forma da Morte (v2): esqueleto de 65 ossos fornecido + foice.

Gera models/v2_lich.blend, exports/v2_lich.glb (corpo, foice no osso `Scythe` e animações) e
exports/v2_lich_scythe.glb (foice solta, na escala do jogo, para o arremesso).
Executar na raiz: blender --background --python blender/scripts/lich.py
Fontes originais e hashes em reference/lich/. O Lich voa e comanda a foice com a mente: ela é uma malha rígida ligada a
um osso livre (`Scythe`) que flutua ao lado dele e se move em órbita nos golpes; as mãos só conduzem (IK analítico de dois
ossos, calculado aqui e gravado como rotações FK; o GLB não contém restrições).
"""
from pathlib import Path
import bpy, math, sys
from mathutils import Vector, Quaternion, Matrix
BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE / 'scripts'))
from common import reset_scene
reset_scene()
sc = bpy.context.scene
sc.render.fps = 24
REF = BASE / 'reference/lich'
HEIGHT = 2.6        # altura visual em jogo (v2/assets/models.json)
SCYTHE_LEN = 0.95   # comprimento da foice, em unidades do modelo (corpo = 1,0); a primeira versão (1,25) ficou grande demais
GRIP = 0.50         # origem da foice ao longo do cabo (centro): ela flutua e gira em torno dele
PI = math.pi

bpy.ops.import_scene.gltf(filepath=str(REF / 'skeleton_knight.glb'))
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
for o in list(sc.objects):
    if o.type == 'MESH' and not any(m.type == 'ARMATURE' for m in o.modifiers):
        bpy.data.objects.remove(o, do_unlink=True)   # esfera auxiliar do arquivo original
body = next(o for o in sc.objects if o.type == 'MESH')
body.name = 'LichBody'

# ── foice ──
before = set(sc.objects)
bpy.ops.import_scene.gltf(filepath=str(REF / 'fantasy_scythe.glb'))
scythe = next(o for o in sc.objects if o not in before and o.type == 'MESH')
scythe.name = 'LichScythe'
scythe.data.transform(scythe.matrix_world)
scythe.matrix_world = Matrix.Identity(4)
scythe.parent = None
projectile = scythe.copy()
projectile.data = scythe.data.copy()
projectile.name = 'LichScytheProjectile'
sc.collection.objects.link(projectile)

def frame_matrix(g, d, b):
    """Quadro da foice: X = lâmina (lateral), Y = cabo em direção à cabeça, origem no punho."""
    d = Vector(d).normalized()
    x = (Vector(b) - d * Vector(b).dot(d)).normalized()
    z = x.cross(d)
    m = Matrix(((x.x, d.x, z.x, g[0]), (x.y, d.y, z.y, g[1]), (x.z, d.z, z.z, g[2]), (0, 0, 0, 1)))
    return m

def rotation(yaw, pitch, roll):
    """Orientação por guinada (mundo, 0 = para frente = -Y, + para a esquerda), elevação e giro do cabo."""
    r = Matrix.Rotation(yaw, 4, 'Z') @ Matrix.Rotation(-pitch, 4, 'X') @ Matrix.Rotation(roll, 4, 'Y')
    return r.to_3x3() @ Vector((0, -1, 0)), r.to_3x3() @ Vector((1, 0, 0))

# Pose de encaixe (bind): foice deitada na altura da cintura, dentro da altura do corpo, para que a medida de altura do
# renderizador (caixa da malha em repouso) continue sendo a do corpo. As animações são relativas a esta pose.
S0 = frame_matrix((0, -0.35, 0.5), (1, 0, 0), (0, -1, 0))
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones.new('Scythe')
eb.head = (0, 0, 0)
eb.tail = (0, 0.2, 0)
eb.matrix = S0
bpy.ops.object.mode_set(mode='OBJECT')
B0 = arm.data.bones['Scythe'].matrix_local.copy()
scale = SCYTHE_LEN
to_frame = Matrix.Scale(scale, 4) @ Matrix.Translation((0, -GRIP, 0)) @ Matrix((((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1))))
# Projétil: origem no centro do cabo, escala de jogo, sem osso.
mid = Matrix.Scale(scale * HEIGHT, 4) @ Matrix.Translation((0, -0.5, 0)) @ Matrix((((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1))))
projectile.data.transform(mid)
scythe.data.transform(B0 @ to_frame)
group = scythe.vertex_groups.new(name='Scythe')
group.add(range(len(scythe.data.vertices)), 1.0, 'REPLACE')
mod = scythe.modifiers.new('Armature', 'ARMATURE')
mod.object = arm
scythe.parent = arm
scythe.matrix_parent_inverse = Matrix.Identity(4)

# ── utilitários de pose (mesmos do pipeline dos humanoides importados) ──
def bone(n):
    return arm.pose.bones['mixamorig:' + n]

def pose_matrix(b):
    local = Matrix.Translation(b.location) @ b.rotation_quaternion.to_matrix().to_4x4()
    rest = b.bone.matrix_local
    if b.parent:
        return pose_matrix(b.parent) @ b.parent.bone.matrix_local.inverted() @ rest @ local
    return rest @ local

def aim(n, direction):
    b = bone(n)
    rest = b.bone.matrix_local.to_3x3()
    parent = pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted() if b.parent else Matrix.Identity(3)
    target = parent.inverted() @ Vector(direction).normalized()
    delta = (b.bone.tail_local - b.bone.head_local).normalized().rotation_difference(target)
    b.rotation_quaternion = (rest.inverted() @ delta.to_matrix() @ rest).to_quaternion()

def rotate(n, axis, angle):
    b = bone(n)
    local = b.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
    b.rotation_quaternion = Quaternion(local.normalized(), angle) @ b.rotation_quaternion

def head(n):
    return pose_matrix(bone(n)).translation

def reach_arm(side, target, hint):
    """IK de dois ossos: devolve a posição real do pulso (limitada ao alcance do braço)."""
    a, f, h = bone(side + 'Arm'), bone(side + 'ForeArm'), bone(side + 'Hand')
    s = pose_matrix(a).translation
    l1 = (f.bone.head_local - a.bone.head_local).length
    l2 = (h.bone.head_local - f.bone.head_local).length
    v = Vector(target) - s
    d = v.length
    top, low = (l1 + l2) * 0.985, abs(l1 - l2) + 0.02
    if d > top:
        v *= top / d
        d = top
    elif d < low:
        v = (v / max(d, 1e-6)) * low
        d = low
    u = v / d
    along = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    out = math.sqrt(max(0, l1 * l1 - along * along))
    hint = Vector(hint)
    perp = hint - u * hint.dot(u)
    perp = perp.normalized() if perp.length > 1e-6 else Vector((0, 0, -1))
    elbow = s + u * along + perp * out
    aim(side + 'Arm', elbow - s)
    aim(side + 'ForeArm', s + v - elbow)
    return s + v

def palm_offset(side):
    """Centro da mão (palma e dedos) em relação ao pulso, no repouso: é ele, e não o osso do pulso, que deve ficar sobre o cabo."""
    prefix = 'mixamorig:' + side + 'Hand'
    groups = {g.index for g in body.vertex_groups if g.name.startswith(prefix)}
    pts = [v.co.copy() for v in body.data.vertices if any(g.group in groups and g.weight > .3 for g in v.groups)]
    return sum(pts, Vector()) / len(pts) - head(side + 'Hand')
PALM = {side: palm_offset(side) for side in ('Left', 'Right')}

def reach_hand(side, target, hint):
    """IK que leva o centro da mão (não o pulso) ao alvo; devolve onde o centro da mão realmente ficou."""
    off = PALM[side]
    reach_arm(side, target, hint)
    for _ in range(3):
        hb = bone(side + 'Hand')
        m = pose_matrix(hb).to_3x3() @ hb.bone.matrix_local.to_3x3().inverted()
        reach_arm(side, Vector(target) - m @ off, hint)
    hb = bone(side + 'Hand')
    return head(side + 'Hand') + (pose_matrix(hb).to_3x3() @ hb.bone.matrix_local.to_3x3().inverted()) @ off

FINGERS = ('Index', 'Middle', 'Ring', 'Pinky')

def curl_free(side, k):
    """Dedos: k = 0 abertos, 1 fechados."""
    for digit in FINGERS:
        for joint in (1, 2, 3):
            rotate(side + 'Hand' + digit + str(joint), (0, 1, 0), (.9 if side == 'Left' else -.9) * k)

# ── estados e quadros-chave ──
# O Lich voa e comanda a foice com a mente: ela flutua ao lado dele (nunca está na mão) e as mãos só conduzem.
# A foice é posicionada em coordenadas polares em torno do peito: pyaw/r/z = lugar; yaw/pitch/roll = orientação do cabo.
DEF = dict(pyaw=math.radians(-110), r=.55, z=.74, yaw=0.0, pitch=math.radians(80), roll=PI / 2, scale=1.0,
           arms='rest', RH=None, LH=None, fing=.3,
           twist=None, hipyaw=None, lean=0.0, tilt=0.0, head=0.0, pitchb=0.0, bank=0.0, push=0.0,
           trail=.15, crouch=0.0, fall=0.0, float=.2, Gd=None, dk=0.0, conv=.26)
FOOT_Z = min(head('LeftFoot').z, head('RightFoot').z)       # altura do pé em repouso (contato com o chão)
BODY = ('Head', 'Hips', 'Spine2', 'LeftArm', 'RightArm', 'LeftHand', 'RightHand', 'LeftFoot', 'RightFoot', 'LeftUpLeg', 'RightUpLeg')
DEATH_FLOOR = 0.17  # altura mínima dos ossos do corpo deitado (a malha tem ≈0,2 de volume abaixo dos ossos)
CENTER = (0.0, -0.05)   # centro das órbitas da foice, no plano do chão

def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def clamp01(x):
    return max(0.0, min(1.0, x))

def lerp(a, b, t):
    if a is None or b is None:
        return b if t >= 1 else a
    if isinstance(a, (tuple, list)):
        return tuple(lerp(x, y, t) for x, y in zip(a, b))
    if isinstance(a, (bool, str)):
        return b if t >= .5 else a
    return a + (b - a) * t

def sample(keys, u):
    keys = sorted(keys, key=lambda k: k[0])
    if u <= keys[0][0]:
        return {**DEF, **keys[0][1]}
    for (t0, s0), (t1, s1) in zip(keys, keys[1:]):
        if u <= t1:
            t = ease((u - t0) / (t1 - t0)) if t1 > t0 else 1
            a, b = {**DEF, **s0}, {**DEF, **s1}
            return {k: lerp(a[k], b[k], t) for k in DEF}
    return {**DEF, **keys[-1][1]}

R = math.radians
def atk(yaw, r=.75, z=.7, **kw):
    """Golpe: a foice gira em torno do Lich com o cabo na direção radial; ele inclina o corpo e conduz com as mãos."""
    return {**dict(pyaw=yaw, r=r, z=z, yaw=yaw, pitch=0, roll=0, arms='conduct', trail=.2, float=.2), **kw}
IDLE = {}
CLIPS = {
 'idle': (48, True, None),
 'walk': (24, True, None),
 'slash': (18, False, [(0, atk(R(-75), r=.5, z=.8, pitch=R(15), lean=-.05)),
                       (.22, atk(R(-95), r=.42, z=.9, pitch=R(30), lean=-.14, push=-.05, tilt=-.08)),
                       (.52, atk(0, r=.85, z=.68, lean=.24, push=.12, pitchb=.12, float=.22)),
                       (.76, atk(R(80), r=.78, z=.7, lean=.16, push=.08, pitchb=.08)), (1, IDLE)]),
 'combo_1': (18, False, [(0, atk(R(-75), r=.5, z=.8, pitch=R(15), lean=-.05)),
                         (.22, atk(R(-98), r=.4, z=.92, pitch=R(32), lean=-.16, push=-.06, tilt=-.1)),
                         (.52, atk(0, r=.88, z=.68, lean=.26, push=.14, pitchb=.14, float=.22)),
                         (.76, atk(R(85), r=.8, z=.7, lean=.17, push=.09, pitchb=.08)),
                         (1, atk(R(90), r=.7, z=.72, lean=.12, push=.05))]),
 'combo_2': (18, False, [(0, atk(R(88), r=.7, z=.72, roll=PI, lean=.1, push=.05)),
                         (.2, atk(R(105), r=.42, z=.92, pitch=R(30), roll=PI, lean=-.12, push=-.05, tilt=-.08)),
                         (.52, atk(0, r=.88, z=.66, roll=PI, lean=.26, push=.14, pitchb=.14, float=.22)),
                         (.76, atk(R(-85), r=.8, z=.7, roll=PI, lean=.17, push=.09, pitchb=.08)),
                         (1, atk(R(-90), r=.7, z=.72, roll=PI, lean=.12, push=.05))]),
 'combo_3': (30, False, [(0, atk(R(-85), r=.7, z=.72, lean=.1, push=.05)),
                         (.25, atk(R(-80), r=.25, z=1.22, pitch=R(125), roll=PI / 2, lean=-.18, tilt=-.15, float=.32, trail=.6)),
                         (.45, atk(R(-80), r=.25, z=1.22, pitch=R(110), roll=PI / 2, hipyaw=R(-30), lean=-.1, float=.34, trail=.6)),
                         (.82, atk(R(-80) + 2 * PI, r=.9, z=.7, hipyaw=2 * PI, lean=.05, float=.3)),
                         (1, atk(R(10) + 2 * PI, r=.78, z=.45, pitch=R(-50), roll=PI / 2, hipyaw=2 * PI, lean=.3, pitchb=.2, push=.14, float=.22))]),
 'throw': (20, False, [(0, atk(R(-50), r=.5, z=.8, pitch=R(25))),
                       (.3, atk(R(-110), r=.4, z=.92, pitch=R(40), lean=-.16, tilt=-.1, push=-.05)),
                       (.46, atk(R(-5), r=.9, z=.75, pitch=R(10), lean=.22, push=.12, pitchb=.14)),
                       (.48, atk(R(-5), r=.9, z=.75, pitch=R(10), lean=.22, push=.12, pitchb=.14, scale=.001)),
                       (.75, atk(R(-5), r=.9, z=.75, scale=.001, lean=.14, push=.06)),
                       (1, dict(scale=.001, arms='conduct', lean=.05))]),
 'catch': (10, False, [(0, dict(scale=.001, arms='conduct', lean=.05)),
                       (.5, dict(scale=.001, arms='conduct', lean=.02)),
                       (.55, dict(scale=1.0, arms='conduct')), (1, IDLE)]),
 'sweep': (24, False, [(0, atk(R(-80), r=.55, z=.8, pitch=R(10))),
                       (.32, atk(R(-120), r=.45, z=.92, pitch=R(20), lean=-.14, tilt=-.1)),
                       (.5, atk(R(-20), r=.9, z=.7, lean=.22, push=.12, pitchb=.14)),
                       (.52, atk(R(-20), r=.9, z=.7, lean=.22, push=.12, pitchb=.14, scale=.001)),
                       (.75, dict(scale=.001, hipyaw=R(25), lean=.12, arms='conduct', pyaw=R(-20), r=.9)),
                       (1, dict(scale=.001, arms='conduct', lean=.05))]),
 'spin': (24, True, None),
 'transform': (36, False, None),
 'hit': (8, False, None),
 'death': (30, False, None),
}

def special(name, u):
    """Clipes definidos por função."""
    if name == 'spin':
        s = math.sin(u * math.tau)
        return dict(DEF, scale=.001, arms='spread', hipyaw=.35 * s, twist=.5 * s, tilt=-.1, head=-.2 * s, float=.34 + .03 * s, trail=.55)
    if name == 'transform':
        # A: encolhido no chão, punhos no peito. B: sobe de uma vez, braços abertos. C: a foice se materializa. D: assenta flutuando.
        a = ease(u / .3)
        rise = ease((u - .32) / .25)
        settle = ease((u - .72) / .28)
        open_ = math.sin(clamp01((u - .3) / .45) * PI)
        grow = clamp01((u - .5) / .22)
        scale = .001 if u < .5 else (.001 + 1.14 * ease(grow) if u < .72 else 1.14 - .14 * ease((u - .72) / .12) if u < .84 else 1.0)
        crouch = (.95 * a if u < .32 else .95 * (1 - rise)) * (1 - settle)
        return dict(DEF, crouch=crouch, trail=.15 * rise, conv=.26 * rise, float=.34 * rise * (1 - .4 * settle), lean=.5 * a * (1 - rise), tilt=-.3 * open_ + .1 * a * (1 - rise), head=-.25 * open_,
                    scale=scale, arms='spread' if open_ > .15 else 'fist', fing=.9 * (1 - rise) + .2 * rise, pitchb=.0)
    if name == 'hit':
        s = math.sin(u * PI)
        return dict(DEF, lean=-.3 * s, tilt=-.14 * s, head=.2 * s, pitchb=-.12 * s, bank=.1 * s, float=.2 + .05 * s, trail=.15 + .3 * s, arms='conduct',
                    pitch=R(80) - .6 * s, yaw=.5 * s)
    if name == 'death':
        stagger = ease(u / .15)
        buckle = ease((u - .15) / .25)
        topple = ease((u - .3) / .5)
        drop = clamp01((u - .28) / .5)
        return dict(DEF, crouch=.15 * stagger + .75 * buckle, lean=-.28 * stagger - .1 * buckle, fall=topple, tilt=-.15 * stagger, head=-.35 * stagger, scale=1.0,
                    Gd=(-0.62, 0.0, 0.17), dk=ease(drop) ** 2, yaw=lerp(0, R(6), drop), pitch=lerp(R(80), 0, ease(drop)), roll=lerp(PI / 2, PI, ease(drop)),
                    float=.2 * (1 - ease(u / .3)), trail=.15, arms='rest')
    return None

def hand_pose(side, palm, splay):
    """Palma virada para a frente (torção em torno do eixo do antebraço) e dedos abertos em leque."""
    b = bone(side + 'Hand')
    b.rotation_quaternion = Quaternion((0, 1, 0), palm) @ b.rotation_quaternion
    sign = 1 if side == 'Left' else -1
    for digit, k in zip(FINGERS, (1, .35, -.35, -1)):
        rotate(side + 'Hand' + digit + '1', (0, 0, 1), sign * splay * k)

def hips_up(delta):
    bone('Hips').location.y += delta   # eixo local Y do quadril = vertical do mundo

def hips_shift(world):
    """Desloca o quadril por um vetor do mundo (o osso guarda a posição nos eixos de repouso)."""
    b = bone('Hips')
    b.location += b.bone.matrix_local.to_3x3().inverted() @ Vector(world)

def min_z(names):
    return min(head(n).z for n in names)

def polar(pyaw, r, z):
    return Vector((CENTER[0] + r * math.sin(pyaw), CENTER[1] - r * math.cos(pyaw), z))

def apply(st, name, u, f, length):
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = Quaternion()
        b.location = (0, 0, 0)
        b.scale = (1, 1, 1)
    aim('LeftArm', (.25, -.2, -1)); aim('LeftForeArm', (-.15, -1, .25))
    aim('RightArm', (-.2, -.15, -1)); aim('RightForeArm', (-.1, -.7, .4))
    yaw = st['yaw']
    conduct = st['arms'] == 'conduct' and name != 'combo_3'
    hip = st['hipyaw'] if st['hipyaw'] is not None else (.25 * max(-1.2, min(1.2, yaw)) if conduct else 0)
    twist = st['twist'] if st['twist'] is not None else (.55 * max(-1.3, min(1.3, yaw)) if conduct else 0)
    sway = 0.0
    if name in ('idle', 'walk'):
        # Voo parado: pés, pernas e braços não se mexem; o corpo e a foice só sobem e descem, em fases diferentes.
        phi = u * math.tau
        bob = math.sin(phi)
        hip = twist = 0
        base = dict(trail=.06, bank=0, head=0, lean=.0, pitchb=.0, arms='open', pyaw=R(-118), r=.58, yaw=0, pitch=R(80))
        if name == 'walk':
            base.update(trail=.2, pitchb=.1, lean=.04, head=-.05)
        if name == 'idle':
            base.update(pyaw=R(-110), r=.55)
        st = dict(st, **base, float=(.22 if name == 'walk' else .2) + .035 * bob, z=.74 + .04 * math.sin(phi - 1.1))
    # pernas: soltas e penduradas para trás (nunca em passo)
    k = st['trail']
    rotate('LeftUpLeg', (1, 0, 0), .55 * k); rotate('RightUpLeg', (1, 0, 0), .55 * k)
    rotate('LeftLeg', (1, 0, 0), .9 * k); rotate('RightLeg', (1, 0, 0), .9 * k)
    rotate('LeftFoot', (1, 0, 0), .95); rotate('RightFoot', (1, 0, 0), .95)
    if st['conv']:
        rotate('LeftUpLeg', (0, 1, 0), st['conv']); rotate('RightUpLeg', (0, 1, 0), -st['conv'])   # pés juntos no eixo central
    if st['crouch']:
        c = st['crouch']
        rotate('LeftUpLeg', (1, 0, 0), .9 * c); rotate('RightUpLeg', (1, 0, 0), .9 * c)
        rotate('LeftLeg', (1, 0, 0), -1.5 * c); rotate('RightLeg', (1, 0, 0), -1.5 * c)
    if st['pitchb']:
        rotate('Hips', (1, 0, 0), st['pitchb'])
    if st['bank']:
        rotate('Hips', (0, 1, 0), st['bank'])
    rotate('Hips', (0, 0, 1), hip)
    for n, kk in (('Spine', .25), ('Spine1', .25), ('Spine2', .5)):
        rotate(n, (0, 0, 1), twist * kk)
    if st['lean']:
        rotate('Spine', (1, 0, 0), st['lean'] * .5); rotate('Spine1', (1, 0, 0), st['lean'] * .5)
    if st['tilt']:
        rotate('Spine2', (1, 0, 0), st['tilt'])
    if st['head']:
        rotate('Head', (0, 0, 1), st['head'])
    if st['fall']:
        rotate('Hips', (1, 0, 0), -1.5 * st['fall'])
    # altura: o pé mais baixo fica `float` acima do chão; deitado, o osso mais baixo apoia no chão
    feet_fix = FOOT_Z - min_z(('LeftFoot', 'RightFoot'))
    if st['fall']:
        hips_up(lerp(feet_fix + st['float'], DEATH_FLOOR - min_z(BODY), ease(st['fall'] * 1.8)))
    else:
        hips_up(feet_fix + st['float'])
    if st['push']:
        hips_shift((0, -st['push'], 0))
    bpy.context.view_layer.update()
    chest = pose_matrix(bone('Spine2')) @ bone('Spine2').bone.matrix_local.inverted()
    hips = pose_matrix(bone('Hips')) @ bone('Hips').bone.matrix_local.inverted()
    ref = hips if name in ('idle', 'walk') else chest
    # mãos: relaxadas, ou conduzindo a foice
    rest_r, rest_l = head('RightHand'), head('LeftHand')
    py = st['pyaw']
    modes = {
        'rest': (rest_r + Vector((-.04, -.05, .05)), rest_l + Vector((.04, -.05, .05)), .35),
        'fist': (chest @ Vector((-.12, -.2, .52)), chest @ Vector((.12, -.2, .52)), .9),
        'spread': (chest @ Vector((-.34, -.04, .84)), chest @ Vector((.34, -.04, .84)), .1),
        'open': (chest @ Vector((-.44, -.22, .42)), chest @ Vector((.44, -.22, .42)), .12),
        'conduct': (chest @ Vector((-.06 + .3 * math.sin(py), -.1 - .3 * math.cos(py), .72)), chest @ Vector((.2 - .08 * math.sin(py), -.14, .62)), .12),
    }
    rh, lh, fing = modes[st['arms']]
    if st['RH'] is not None:
        rh = chest @ Vector(st['RH'])
    if st['LH'] is not None:
        lh = chest @ Vector(st['LH'])
    if name in ('idle', 'walk'):
        rh = rh + Vector((0, -.03 * sway, .02 * sway)); lh = lh + Vector((0, .03 * sway, .02 * sway))
    reach_hand('Right', rh, (-.5, .6, -.8))
    reach_hand('Left', lh, (.5, .6, -.8))
    if st['fing'] != DEF['fing']:
        fing = st['fing']
    curl_free('Right', fing); curl_free('Left', fing)
    if st['arms'] == 'open':
        hand_pose('Right', -1.2, .22); hand_pose('Left', 1.2, .22)
    # foice
    g = (ref @ polar(py, st['r'], st['z'])) if name in ('idle', 'walk') else (chest @ polar(py, st['r'], st['z']))
    if st['dk']:
        g = Vector(g).lerp(Vector(st['Gd']), st['dk'])   # foice solta: cai ao chão quando o controle se perde
    d, bl = rotation(st['yaw'], st['pitch'], st['roll'])
    w = frame_matrix(g, d, bl)
    basis = B0.inverted() @ w
    sb = arm.pose.bones['Scythe']
    sb.rotation_mode = 'QUATERNION'
    loc, rot, _ = basis.decompose()
    sb.location, sb.rotation_quaternion = loc, rot
    sb.scale = (st['scale'],) * 3
    for b in arm.pose.bones:
        b.keyframe_insert('rotation_quaternion', frame=f + 1)
        if b.name.endswith('Hips') or b.name == 'Scythe':
            b.keyframe_insert('location', frame=f + 1)
        if b.name == 'Scythe':
            b.keyframe_insert('scale', frame=f + 1)

arm.animation_data_create()
for name, (length, loop, keys) in CLIPS.items():
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    arm.animation_data.action = action
    for f in range(length + 1):
        u = f / length
        st = special(name, u) or (sample(keys, u) if keys else dict(DEF))
        apply(st, name, u, f, length)
    action['loop'] = loop
arm.animation_data.action = bpy.data.actions['idle']
arm.animation_data.action_slot = bpy.data.actions['idle'].slots[0]
sc.frame_set(1)
sc.frame_end = 49

# ── exportação ──
def export(path, objs, **kw):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_yup=True, **kw)

projectile.hide_set(True)
export(BASE / 'exports/v2_lich.glb', [arm, *arm.children_recursive], export_animation_mode='ACTIONS', export_skins=True, export_force_sampling=True)
projectile.hide_set(False)
for o in sc.objects:
    o.select_set(False)
projectile.select_set(True)
bpy.ops.object.shade_smooth() if False else None
bpy.context.view_layer.objects.active = projectile
bpy.ops.export_scene.gltf(filepath=str(BASE / 'exports/v2_lich_scythe.glb'), export_format='GLB', use_selection=True, export_yup=True, export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE / 'models/v2_lich.blend'))
print('LICH_EXPORTED', list(CLIPS))
