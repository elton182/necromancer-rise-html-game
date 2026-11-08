"""Caminhada e combo de espada do Guerreiro com movimento contínuo (quadril conduz, tronco, braço e lâmina seguem).

Opera sobre a cena aberta `models/warrior.blend` (via MCP: exec deste arquivo na sessão do Blender) e só substitui
as chaves das ações `walk`, `slash_1`, `slash_2` e `slash_3`; as demais ações, malha, rig e trilhas NLA ficam intactas.
Antes de gravar, salva uma cópia em `backups/`. Para publicar: `scripts/warrior_export_manual.py` e `node v2/tools/build.cjs`.

Contrato com o jogo (v2/scripts/warrior.mjs, v2/assets/models.json):
- 30 fps. slash_1: 19 frames, impacto no frame 12 (11/30 s). slash_2: 17 frames, impacto no 9 (8/30 s).
  slash_3: 13 frames, impacto no 9. O último frame de slash_1 e slash_2 fica parado na janela do combo e é o
  primeiro frame do corte seguinte; o último de slash_2 é também a pose do Corte tornado.
- walk: 25 frames em laço, passada de 2,2 u (`stride`); os pés seguem a mesma trajetória de
  `warrior_walk_stride.py`, para não escorregar. Só o corpo, a cabeça e os braços ganham movimento.

Curvas: Hermite com tangentes Catmull-Rom entre as chaves (o movimento não para em cada pose), tangente zero nas
pontas e nas chaves marcadas com HOLD (antecipação e pose de ligação). O tronco segue o quadril com atraso de frame,
e a cabeça compensa parte da torção para manter o olhar no alvo.
"""
from pathlib import Path
from datetime import datetime
import json
import math
import shutil
import bpy
from mathutils import Vector, Quaternion, Matrix, Euler

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
rig = bpy.data.objects['WarriorRig']
_pose_ns = {}
exec(compile((ROOT / 'scripts/warrior_pose.py').read_text(encoding='utf-8'), str(ROOT / 'scripts/warrior_pose.py'), 'exec'), _pose_ns)
arm_pose = _pose_ns['arm_pose']
ONLY = globals().get('ONLY') or ['walk', 'slash_1', 'slash_2', 'slash_3']
SAVE = globals().get('SAVE', True)
HOLD = 'hold'


def B(name):
    return rig.pose.bones['mixamorig:' + name]


def upd():
    bpy.context.view_layer.update()


# ---------------------------------------------------------------- curvas
def _lerp(a, b, u):
    if isinstance(a, (int, float)):
        return a + (b - a) * u
    return Vector(a).lerp(Vector(b), u)


def sample(keys, f):
    """keys: [(frame, valor) | (frame, valor, HOLD)]; Hermite cúbica com tangentes Catmull-Rom."""
    frames = [k[0] for k in keys]
    vec = not isinstance(keys[0][1], (int, float))
    vals = [Vector(k[1]) if vec else float(k[1]) for k in keys]
    if f <= frames[0]:
        return vals[0].copy() if vec else vals[0]
    if f >= frames[-1]:
        return vals[-1].copy() if vec else vals[-1]

    def tangent(i):
        if i == 0 or i == len(keys) - 1 or (len(keys[i]) > 2 and keys[i][2] == HOLD):
            return vals[i] * 0 if vec else 0.0
        return (vals[i + 1] - vals[i - 1]) / (frames[i + 1] - frames[i - 1])

    i = max(j for j in range(len(frames) - 1) if frames[j] <= f)
    h = frames[i + 1] - frames[i]
    u = (f - frames[i]) / h
    h00 = 2 * u ** 3 - 3 * u ** 2 + 1
    h10 = u ** 3 - 2 * u ** 2 + u
    h01 = -2 * u ** 3 + 3 * u ** 2
    h11 = u ** 3 - u ** 2
    return vals[i] * h00 + tangent(i) * (h10 * h) + vals[i + 1] * h01 + tangent(i + 1) * (h11 * h)


def rot_about(bone, q, pivot=None):
    """Aplica rotação q (espaço do rig) ao osso, em torno de `pivot` (padrão: cabeça do osso)."""
    pivot = bone.head.copy() if pivot is None else Vector(pivot)
    m = Matrix.Translation(pivot) @ q.to_matrix().to_4x4() @ Matrix.Translation(-pivot)
    bone.matrix = m @ bone.matrix
    upd()


def euler_q(pitch=0.0, roll=0.0, yaw=0.0):
    """pitch: inclina para a frente (+X); roll: lado esquerdo desce (+Y); yaw: vira à esquerda (+Z). Frente = -Y."""
    return Quaternion((0, 0, 1), yaw) @ Quaternion((1, 0, 0), pitch) @ Quaternion((0, 1, 0), roll)


# ---------------------------------------------------------------- pose base (guarda do idle, frame 1)
def capture_base():
    previous = rig.animation_data.action
    rig.animation_data.action = bpy.data.actions['idle']
    scene.frame_set(1)
    upd()
    base = {b.name: (b.location.copy(), b.rotation_quaternion.copy(), b.scale.copy()) for b in rig.pose.bones}
    arm = {b.name: b.matrix.copy() for b in rig.pose.bones}
    rig.animation_data.action = previous
    return base, arm


def reset_to(base):
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'
        loc, rot, scl = base[b.name]
        b.location = loc
        b.rotation_quaternion = rot
        b.scale = scl
    upd()


def two_bone(upper, lower, root, target, pole):
    l1 = upper.bone.length
    l2 = lower.bone.length
    delta = target - root
    dist = min(delta.length, l1 + l2 - .0005)
    axis = delta.normalized()
    target = root + axis * dist
    along = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
    bend = pole - root
    normal = (bend - axis * bend.dot(axis)).normalized()
    knee = root + axis * along + normal * math.sqrt(max(0, l1 * l1 - along * along))
    for bone, head, tail in [(upper, root, knee), (lower, knee, target)]:
        direction = bone.bone.tail_local - bone.bone.head_local
        q = direction.rotation_difference(tail - head) @ bone.bone.matrix_local.to_quaternion()
        bone.matrix = Matrix.LocRotScale(head, q, Vector((1, 1, 1)))
        upd()
    return target


def solve_leg(side, base_arm, offset=(0, 0, 0), yaw=0.0, heel=0.0):
    """Pé apoiado na base da guarda: gira sobre a planta (yaw) e levanta o calcanhar sobre os dedos (heel)."""
    upper, lower, foot, toe = (B(side + n) for n in ('UpLeg', 'Leg', 'Foot', 'ToeBase'))
    ankle0 = base_arm[foot.name].translation.copy()
    ball0 = base_arm[toe.name].translation.copy()
    fq0 = base_arm[foot.name].to_quaternion()
    tq0 = base_arm[toe.name].to_quaternion()
    ball = ball0 + Vector(offset)
    qy = Quaternion((0, 0, 1), yaw)
    lateral = qy @ Vector((1, 0, 0))
    qh = Quaternion(lateral, -heel)
    ankle = ball + qh @ (qy @ (ankle0 - ball0))
    if (ankle - ball).z < (ankle0 - ball0).z - 1e-6 and heel > 0:
        qh = Quaternion(lateral, heel)
        ankle = ball + qh @ (qy @ (ankle0 - ball0))
    pole = ankle + qy @ Vector((0, -.20, .12))
    reached = two_bone(upper, lower, upper.head.copy(), ankle, pole)
    foot.matrix = Matrix.LocRotScale(reached, qh @ qy @ fq0, Vector((1, 1, 1)))
    upd()
    toe.matrix = Matrix.LocRotScale(toe.head.copy(), qy @ tq0, Vector((1, 1, 1)))
    upd()
    return (reached - ankle).length


def stabilize_head(base_arm, keep_yaw=.62, keep_pitch=.5, extra=(0, 0, 0)):
    head = B('Head')
    q = head.matrix.to_quaternion() @ base_arm[head.name].to_quaternion().inverted()
    e = q.to_euler('ZXY')
    corr = Euler((-keep_pitch * e.x + extra[0], -.4 * e.y + extra[1], -keep_yaw * e.z + extra[2]), 'ZXY').to_quaternion()
    half = Quaternion().slerp(corr, .4)
    rot_about(B('Neck'), half)
    rot_about(head, half.inverted() @ corr)


def key_all(frame, previous):
    for b in rig.pose.bones:
        q = b.rotation_quaternion.copy()
        if b.name in previous and previous[b.name].dot(q) < 0:
            q.negate()
            b.rotation_quaternion = q
        previous[b.name] = q
        b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
        b.keyframe_insert('location', frame=frame, group=b.name)
        b.keyframe_insert('scale', frame=frame, group=b.name)


def clear_action(action):
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                bag.fcurves.clear()


def smooth_keys(action):
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:
                        k.interpolation = 'BEZIER'
                        k.handle_left_type = k.handle_right_type = 'AUTO_CLAMPED'
                    fc.update()


def apply_spine(yaw, pitch, roll, lags, f):
    """Distribui a torção do tronco por Spine/Spine1/Spine2, cada um atrasado em relação ao anterior."""
    for name, share, lag in (('Spine', .30, lags[0]), ('Spine1', .35, lags[1]), ('Spine2', .35, lags[2])):
        rot_about(B(name), euler_q(pitch(f - lag) * share, roll(f - lag) * share, yaw(f - lag) * share))


# ---------------------------------------------------------------- caminhada
WALK_FRAMES = 25
WORLD_SCALE = 2.25 / .72
STRIDE = 2.2
STANCE = .34
REACH = STRIDE * STANCE / 2 / WORLD_SCALE
LIFT = .06
HIP_DROP = .038
FOOT_WIDTH = .012


def _ease(u):
    return u * u * (3 - 2 * u)


def foot_path(t, offset):
    """Mesma trajetória de warrior_walk_stride.py (pé sem escorregar a 2,2 u por ciclo)."""
    phase = (t + offset - .25 + STANCE / 2) % 1
    if phase < STANCE:
        u = phase / STANCE
        return REACH * (2 * u - 1), 0, .08 * (1 - 2 * u), u
    u = (phase - STANCE) / (1 - STANCE)
    return REACH * (1 - 2 * _ease(u)), LIFT * math.sin(math.pi * u), -.2 * math.sin(math.pi * u), None


def build_walk(action, base, base_arm):
    data = json.loads((ROOT / 'reference/warrior/walk_user_poses.json').read_text(encoding='utf-8'))
    right_arm = ['RightArm', 'RightForeArm', 'RightHand']
    tau = math.tau
    rig.animation_data.action = action
    clear_action(action)
    previous = {}
    worst = 0
    for frame in range(1, WALK_FRAMES + 1):
        t = (frame - 1) / (WALK_FRAMES - 1)
        reset_to(base)
        # Braço da espada: as cinco poses manuais do usuário, ida e volta no ciclo (como warrior_walk_refine.py).
        progress = (t * 2 if t <= .5 else (1 - t) * 2) * 4
        index = min(3, int(progress))
        u = _ease(progress - index)
        for name in right_arm:
            a = Quaternion(data['poses'][index][name])
            b = Quaternion(data['poses'][index + 1][name])
            B(name).rotation_quaternion = a.slerp(b, u)
        upd()
        # Quadril: queda e subida (mais baixo no meio do apoio), balanço lateral sobre o pé de apoio,
        # giro da bacia acompanhando a perna que avança e queda do lado da perna no ar.
        bob = .0065 * -math.cos(2 * tau * (t - .25))
        sway = -.0045 * math.cos(tau * (t - .25))
        hip_yaw = .12 * math.cos(tau * (t - .08))
        hip_roll = .045 * math.cos(tau * (t - .25))
        hip_pitch = .055 + .014 * math.cos(2 * tau * (t - .30))
        hips = B('Hips')
        rest = hips.bone.matrix_local
        head = rest.translation + Vector((sway, 0, -HIP_DROP + bob))
        hips.matrix = Matrix.LocRotScale(head, euler_q(hip_pitch, hip_roll, hip_yaw) @ rest.to_quaternion(), Vector((1, 1, 1)))
        upd()
        # Tronco: contra-gira os ombros em relação à bacia, com atraso, e balança um pouco para a frente após o apoio.
        def chest_yaw(fr):
            tt = (fr - 1) / (WALK_FRAMES - 1)
            return -.10 * math.cos(tau * (tt - .12)) - .12 * math.cos(tau * (tt - .08))
        def chest_pitch(fr):
            tt = (fr - 1) / (WALK_FRAMES - 1)
            return .012 + .016 * math.cos(2 * tau * (tt - .34))
        def chest_roll(fr):
            tt = (fr - 1) / (WALK_FRAMES - 1)
            return -.032 * math.cos(tau * (tt - .29))
        apply_spine(chest_yaw, chest_pitch, chest_roll, (0, .6, 1.2), frame)
        # Braços: o peso dos braços responde à queda do corpo um pouco depois (sobreposição).
        bounce = math.cos(2 * tau * (t - .33))
        rot_about(B('RightShoulder'), Quaternion((0, 1, 0), .035 * bounce))
        rot_about(B('RightForeArm'), Quaternion((1, 0, 0), -.07 * math.cos(2 * tau * (t - .37))))
        rot_about(B('RightHand'), Quaternion((1, 0, 0), -.09 * math.cos(2 * tau * (t - .42))))
        rot_about(B('LeftShoulder'), Quaternion((0, 1, 0), -.03 * bounce))
        rot_about(B('LeftArm'), Quaternion((0, 0, 1), .05 * math.cos(tau * (t - .62))) @ Quaternion((1, 0, 0), -.04 * math.cos(2 * tau * (t - .36))))
        # Pernas: alvos idênticos aos de warrior_walk_stride.py.
        for side, sign, offset in (('Right', -1, 0), ('Left', 1, .5)):
            y, z, pitch, _ = foot_path(t, offset)
            rest_foot = B(side + 'Foot').bone.head_local
            joint = B(side + 'UpLeg').bone.head_local
            target = Vector((joint.x + sign * FOOT_WIDTH, joint.y + sign * -.02 + y, rest_foot.z + z))
            upper, lower, foot = B(side + 'UpLeg'), B(side + 'Leg'), B(side + 'Foot')
            reached = two_bone(upper, lower, upper.head.copy(), target, target + Vector((0, -.20, .12)))
            worst = max(worst, (reached - target).length)
            foot.matrix = Matrix.LocRotScale(reached, Quaternion((1, 0, 0), pitch) @ foot.bone.matrix_local.to_quaternion(), Vector((1, 1, 1)))
            upd()
        stabilize_head(base_arm, keep_yaw=.75, keep_pitch=.6)
        key_all(frame, previous)
    smooth_keys(action)
    return worst


# ---------------------------------------------------------------- combo
SHOULDER = Vector((-.107, .40, .514))   # ombro direito na guarda (espaço do rig)


def hand_at(direction, radius):
    return SHOULDER + Vector(direction).normalized() * radius


# Cada chave: (frame, valor[, HOLD]). Mão no espaço do peito na guarda (a torção do tronco a carrega);
# lâmina no espaço do rig.
COMBO = {
    # Corte diagonal de cima à direita para baixo à esquerda. O peso recua para a perna de trás e o tronco enrola
    # (frames 4-9); o pé da frente sai do chão e avança um passo, o quadril desce e dispara primeiro (10), o peito vem
    # atrás e a lâmina chega por último no impacto (12). No acompanhamento o pé da frente recua meio passo; termina na
    # guarda baixa à esquerda, que é a preparação do revés.
    'slash_1': dict(
        frames=19,
        hand=[(1, ((-.15, -.83, -.54), .157)), (4, ((-.40, -.50, .25), .13)), (7, ((-.45, -.05, .70), .15)),
              (9, ((-.45, .02, .72), .155), HOLD), (10, ((-.25, -.50, .62), .17)), (11, ((.05, -.92, .25), .182)),
              (12, ((.42, -.86, -.22), .185)), (14, ((.58, -.58, -.52), .18)), (16, ((.55, -.52, -.60), .175)),
              (19, ((.52, -.55, -.62), .17))],
        blade=[(1, (-.04, -.37, .93)), (4, (-.25, -.05, .97)), (7, (.20, .62, .76)), (9, (.22, .66, .72), HOLD),
               (10, (-.25, -.30, .92)), (11, (0, -.95, .30)), (12, (.70, -.66, -.25)), (14, (.92, -.15, -.30)),
               (16, (.94, 0, -.32)), (19, (.93, .05, -.35))],
        hip_yaw=[(1, 0), (6, -.24), (9, -.30, HOLD), (11, .22), (12, .42), (15, .50), (19, .40)],
        chest_yaw=[(1, 0), (6, -.38), (9, -.50, HOLD), (10, -.34), (11, .06), (12, .36), (14, .46), (19, .34)],
        hip_pitch=[(1, 0), (7, -.07), (9, -.08, HOLD), (12, .18), (14, .21), (19, .12)],
        chest_pitch=[(1, 0), (7, -.11), (9, -.13, HOLD), (11, .08), (12, .22), (14, .26), (19, .14)],
        chest_roll=[(1, 0), (7, -.10), (9, -.12, HOLD), (12, .13), (14, .16), (19, .10)],
        hip_roll=[(1, 0), (7, .05), (9, .06, HOLD), (12, -.06), (19, -.03)],
        hip=[(1, (0, 0, 0)), (7, (-.014, .020, -.004)), (9, (-.016, .024, -.006), HOLD), (11, (.004, -.012, -.030)),
             (12, (.012, -.030, -.048)), (14, (.014, -.032, -.052)), (16, (.010, -.024, -.044)), (19, (.006, -.016, -.034))],
        clavicle=[(1, 0), (7, .22), (9, .24, HOLD), (11, .05), (12, -.04), (19, 0)],
        shield=[(1, (0, 0, 0)), (7, (0, 0, -.10)), (9, (0, 0, -.12), HOLD), (12, (.18, 0, .18)), (19, (.12, 0, .12))],
        right_foot=[(1, (0, 0)), (9, (-.06, 0), HOLD), (11, (.22, .28)), (12, (.40, .55)), (14, (.44, .60)), (19, (.34, .36))],
        left_foot=[(1, (0, 0)), (8, (-.04, .10)), (9, (-.05, .12), HOLD), (10, (.02, .05)), (12, (.14, 0)), (19, (.10, 0))],
        left_step=[(1, (0, 0, 0)), (8, (0, .006, .010)), (9, (0, .006, .014), HOLD), (10, (.002, -.030, .026)),
                   (11, (.004, -.060, .012)), (12, (.004, -.068, 0)), (14, (.004, -.068, 0)), (16, (.003, -.050, .010)),
                   (17, (.002, -.034, .006)), (19, (.002, -.030, 0))],
    ),
    # Revés horizontal da esquerda para a direita, na altura do peito. O quadril gira de um lado ao outro, o peso
    # passa para a perna de trás e o pé direito abre um passo para o lado. Termina com a espada estendida ao lado
    # direito e a base larga (pose de ligação do golpe final e pose do Corte tornado).
    'slash_2': dict(
        frames=17,
        hand=[(1, ((.52, -.55, -.62), .17)), (4, ((.62, -.36, -.46), .17)), (5, ((.64, -.30, -.42), .172), HOLD),
              (7, ((.36, -.88, -.20), .182)), (8, ((-.05, -.97, -.15), .185)), (9, ((-.45, -.85, -.12), .185)),
              (10, ((-.75, -.55, -.05), .182)), (12, ((-.85, -.30, .05), .178)), (17, ((-.90, -.25, .15), .175))],
        blade=[(1, (.93, .05, -.35)), (4, (.85, .45, -.15)), (5, (.78, .60, -.10), HOLD), (7, (.45, -.89, 0)),
               (8, (-.20, -.98, 0)), (9, (-.80, -.60, .03)), (10, (-.97, -.10, .10)), (12, (-.93, .25, .15)),
               (17, (-.92, .22, .30))],
        hip_yaw=[(1, .40), (5, .52, HOLD), (7, .20), (8, -.14), (9, -.40), (11, -.52), (17, -.42)],
        chest_yaw=[(1, .34), (5, .44, HOLD), (7, .30), (8, 0), (9, -.32), (11, -.48), (17, -.36)],
        hip_pitch=[(1, .12), (5, .08, HOLD), (9, .17), (11, .17), (17, .09)],
        chest_pitch=[(1, .14), (5, .07, HOLD), (9, .17), (11, .14), (17, .06)],
        chest_roll=[(1, .10), (5, .13, HOLD), (9, -.06), (11, -.10), (17, -.08)],
        hip_roll=[(1, -.03), (5, -.04, HOLD), (9, .05), (11, .06), (17, .04)],
        hip=[(1, (.006, -.016, -.034)), (5, (.016, -.016, -.038), HOLD), (8, (-.004, -.010, -.046)),
             (9, (-.014, -.006, -.052)), (11, (-.018, -.002, -.052)), (17, (-.014, 0, -.040))],
        clavicle=[(1, 0), (5, 0, HOLD), (9, .05), (17, .12)],
        shield=[(1, (.12, 0, .12)), (5, (.24, 0, .24), HOLD), (9, (0, 0, -.12)), (17, (0, 0, -.06))],
        right_foot=[(1, (.34, .36)), (5, (.40, .42), HOLD), (7, (.10, .05)), (9, (-.12, 0)), (17, (-.16, 0))],
        left_foot=[(1, (.10, 0)), (5, (.12, 0), HOLD), (7, (0, 0)), (9, (-.30, .30)), (11, (-.36, .38)), (17, (-.24, .16))],
        left_step=[(1, (.002, -.030, 0)), (17, (.002, -.030, 0))],
        right_step=[(1, (0, 0, 0)), (5, (0, 0, 0), HOLD), (6, (-.006, 0, .014)), (8, (-.024, -.006, .012)),
                    (9, (-.030, -.008, 0)), (17, (-.030, -.008, 0))],
    ),
    # Golpe final de cima para baixo: a espada sobe pela direita até atrás da cabeça, o corpo sobe nas pontas e recua,
    # o joelho da frente sobe; então o pé bate à frente e o corpo desce inteiro, com o quadril baixo e o calcanhar de
    # trás levantado.
    'slash_3': dict(
        frames=13,
        hand=[(1, ((-.90, -.25, .15), .175)), (3, ((-.70, -.20, .60), .16)), (5, ((-.30, .05, .95), .16)),
              (6, ((-.28, .05, .96), .165), HOLD), (7, ((-.05, -.45, .89), .18)), (8, ((.10, -.95, .30), .185)),
              (9, ((.18, -.90, -.40), .185)), (10, ((.20, -.82, -.52), .18)), (11, ((.20, -.82, -.50), .175)),
              (13, ((.10, -.85, -.50), .17))],
        blade=[(1, (-.92, .22, .30)), (3, (-.55, .40, .73)), (5, (0, .75, .66)), (6, (0, .80, .60), HOLD),
               (7, (0, -.20, .98)), (8, (0, -.92, .38)), (9, (0, -.80, -.60)), (10, (0, -.70, -.71)),
               (11, (0, -.78, -.62)), (13, (0, -.82, -.56))],
        hip_yaw=[(1, -.42), (5, -.26), (7, -.06), (9, .10), (13, .06)],
        chest_yaw=[(1, -.36), (5, -.30), (7, -.14), (9, .05), (13, .02)],
        hip_pitch=[(1, .09), (5, -.12), (6, -.14, HOLD), (8, .16), (9, .34), (10, .37), (13, .27)],
        chest_pitch=[(1, .06), (5, -.16), (6, -.18, HOLD), (8, .20), (9, .42), (10, .45), (13, .32)],
        chest_roll=[(1, -.08), (5, -.06), (9, 0), (13, 0)],
        hip_roll=[(1, .04), (5, 0), (13, 0)],
        hip=[(1, (-.014, 0, -.040)), (4, (-.006, .012, -.010)), (6, (-.004, .018, .004), HOLD),
             (8, (0, -.012, -.050)), (9, (0, -.030, -.085)), (10, (0, -.032, -.090)), (13, (0, -.024, -.072))],
        clavicle=[(1, .12), (5, .30), (6, .30, HOLD), (8, .05), (9, -.05), (13, -.02)],
        shield=[(1, (0, 0, -.06)), (5, (-.16, 0, 0)), (9, (.28, 0, .14)), (13, (.20, 0, .07))],
        right_foot=[(1, (-.16, 0)), (5, (0, .16)), (6, (0, .20), HOLD), (8, (.08, .30)), (9, (.16, .60)), (13, (.12, .50))],
        left_foot=[(1, (-.24, .16)), (4, (-.05, .10)), (6, (0, .20), HOLD), (8, (.02, .10)), (9, (.04, 0)), (13, (.04, 0))],
        left_step=[(1, (.002, -.030, 0)), (4, (.002, -.012, .020)), (6, (.002, -.004, .030), HOLD),
                   (8, (.002, -.030, .012)), (9, (.002, -.040, 0)), (13, (.002, -.040, 0))],
        right_step=[(1, (-.030, -.008, 0)), (3, (-.018, -.004, .014)), (5, (0, 0, 0)), (13, (0, 0, 0))],
    ),
}


def build_slash(name, action, base, base_arm):
    spec = COMBO[name]
    rig.animation_data.action = action
    clear_action(action)
    previous = {}
    chest0 = base_arm[B('Spine2').name]
    hips0 = base_arm[B('Hips').name]
    report = {}
    worst_leg = 0
    for frame in range(1, spec['frames'] + 1):
        reset_to(base)
        s = lambda key, fr=frame: sample(spec[key], fr)
        hips = B('Hips')
        offset = s('hip')
        hips.matrix = Matrix.LocRotScale(hips0.translation + offset,
                                         euler_q(s('hip_pitch'), s('hip_roll') if 'hip_roll' in spec else 0, s('hip_yaw'))
                                         @ hips0.to_quaternion(), Vector((1, 1, 1)))
        upd()
        apply_spine(lambda fr: sample(spec['chest_yaw'], fr), lambda fr: sample(spec['chest_pitch'], fr),
                    lambda fr: sample(spec['chest_roll'], fr), (0, .5, 1.0), frame)
        rot_about(B('RightShoulder'), Quaternion((0, 1, 0), s('clavicle')))
        e = s('shield')
        rot_about(B('LeftArm'), Euler((e.x, e.y, e.z), 'XYZ').to_quaternion())
        for side in ('Right', 'Left'):
            yaw, heel = s(side.lower() + '_foot')
            step = s(side.lower() + '_step') if side.lower() + '_step' in spec else (0, 0, 0)
            worst_leg = max(worst_leg, solve_leg(side, base_arm, tuple(step), yaw, heel))
        # Mão e lâmina no espaço do peito: a rotação do tronco desde a guarda carrega o golpe.
        chest = B('Spine2').matrix @ chest0.inverted()
        cq = chest.to_quaternion()
        direction, radius = sample([(k[0], k[1][0]) + k[2:] for k in spec['hand']], frame), sample([(k[0], k[1][1]) + k[2:] for k in spec['hand']], frame)
        target = chest @ hand_at(direction, radius)
        blade = Vector(s('blade')).normalized()  # lâmina no espaço do rig: é a direção que se lê na tela
        pole = chest @ Vector((-.23, .40, .39))
        arm_pose(rig, 'Right', target, pole, blade, 0)
        stabilize_head(base_arm, keep_yaw=.6, keep_pitch=.5)
        key_all(frame, previous)
        report[frame] = [round(v, 3) for v in B('RightHand').head]
    smooth_keys(action)
    report['pe_fora_do_alcance'] = round(worst_leg, 5)
    return report


# ---------------------------------------------------------------- execução
def run():
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    if SAVE and bpy.data.filepath:
        # Copia o arquivo gravado em disco, não a sessão (que pode ter prévias não salvas).
        (ROOT / 'backups').mkdir(exist_ok=True)
        shutil.copy2(bpy.data.filepath, ROOT / 'backups' / ('warrior_before_fluid_motion_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.blend'))
    previous_action = rig.animation_data.action
    base, base_arm = capture_base()
    tracks = {t.name: t for t in rig.animation_data.nla_tracks}
    out = {}
    for name in ONLY:
        action = tracks[name].strips[0].action
        if name == 'walk':
            out[name] = {'pe_fora_do_alcance': round(build_walk(action, base, base_arm), 5)}
        else:
            report = build_slash(name, action, base, base_arm)
            out[name] = {'frames': list(action.frame_range), 'pe_fora_do_alcance': report['pe_fora_do_alcance']}
    rig.animation_data.action = previous_action
    if SAVE and bpy.data.filepath:
        bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models/warrior.blend'))
    print('WARRIOR_FLUID_MOTION', json.dumps(out))


run()
