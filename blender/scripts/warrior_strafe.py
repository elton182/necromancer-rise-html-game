"""Acrescenta strafe_left e strafe_right à cena autoral do Guerreiro, sem alterar as demais ações.

Uso na raiz: blender --background blender/models/warrior.blend --python blender/scripts/warrior_strafe.py
Grava models/warrior.blend; para publicar, execute scripts/warrior_equipment_export.py via MCP e depois node v2/tools/build.cjs.
O tronco parte do idle com parte do balanço do walk (poses manuais), então espada e escudo continuam na guarda. As pernas usam o IK de warrior_pose.py,
com a mesma fase de apoio do walk (pé direito no chão de 0 a 0,5), para os clipes se misturarem nas diagonais.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector, Quaternion
ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
rig = bpy.data.objects['WarriorRig']
namespace = {}
exec(compile((ROOT / 'scripts/warrior_pose.py').read_text(encoding='utf-8'), str(ROOT / 'scripts/warrior_pose.py'), 'exec'), namespace)
leg_pose = namespace['leg_pose']

FRAMES = 25
WORLD_SCALE = 2.25 / .72     # o jogo normaliza o Guerreiro para 2,25 u; o walk mede 0,48 no rig para os 1,5 u da passada
STRIDE = 1.8                 # avanço por ciclo no jogo, igual ao registro `strafeStride` em v2/assets/models.json; a 4 u/s, passadas menores viram um tremor
CONTACT = .30                # fração do ciclo com cada pé no chão; o resto é um saltito de lado, que evita abrir demais as pernas
REACH = STRIDE * CONTACT / 2 / WORLD_SCALE
STANCE = .10                 # afastamento médio dos pés em relação ao centro, para não se cruzarem no ponto mais próximo
LIFT = .05
UPPER_SWING = .35            # fração do balanço do walk mantida no tronco e nos braços
LEG_BONES = ('UpLeg', 'Leg', 'Foot', 'ToeBase', 'Toe_End')
bones = {b.name.split(':')[-1]: b for b in rig.pose.bones}
def ease(u): return u * u * (3 - 2 * u)
def rest(name): return bones[name].bone.head_local.copy()
CENTER = (rest('LeftFoot').x + rest('RightFoot').x) / 2
LEG_LENGTH = bones['LeftUpLeg'].bone.length + bones['LeftLeg'].bone.length

def sample_action(name, frames):
    # Lê os valores de cada quadro antes de trocar a ação ativa.
    rig.animation_data.action = next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name == name)
    poses = {}
    for frame in frames:
        scene.frame_set(frame); bpy.context.view_layer.update()
        poses[frame] = {b.name: (b.rotation_quaternion.copy(), b.location.copy()) for b in rig.pose.bones}
    return poses

def foot_path(t, offset, direction):
    # Apoio: o pé recua em velocidade constante, sem escorregar no chão. Balanço: retorna em arco. Fase 0,25 é o meio do apoio, como no walk.
    phase = (t + offset - .25 + CONTACT / 2) % 1
    if phase < CONTACT: return direction * (1 - 2 * phase / CONTACT) * REACH, 0
    u = (phase - CONTACT) / (1 - CONTACT)
    return direction * (2 * ease(u) - 1) * REACH, LIFT * math.sin(math.pi * u)

def bake(name, direction, idle, walk):
    action = bpy.data.actions.new(name); action['warrior_asset'] = True; rig.animation_data.action = action
    rest_q = {key: b.bone.matrix_local.to_quaternion() for key, b in bones.items()}
    def world_axis(key, axis, angle): return rest_q[key].inverted() @ Quaternion(axis, angle) @ rest_q[key]
    for frame in range(1, FRAMES + 1):
        scene.frame_set(frame)
        t = (frame - 1) / (FRAMES - 1); wave = math.sin(t * math.tau)
        for b in rig.pose.bones:
            b.rotation_mode = 'QUATERNION'
            q0, l0 = idle[1][b.name]; q1, l1 = walk[frame][b.name]
            leg = b.name.split(':')[-1].removeprefix('Left').removeprefix('Right') in LEG_BONES
            b.rotation_quaternion = Quaternion() if leg else q0.slerp(q1, UPPER_SWING)
            b.location = (0, 0, 0) if leg or b == bones['Hips'] else l0.lerp(l1, UPPER_SWING)
        # Inclina para onde vai; a torção do quadril volta no peito, para o olhar continuar na mira.
        bones['Hips'].rotation_quaternion = world_axis('Hips', (0, 0, 1), .06 * direction) @ bones['Hips'].rotation_quaternion
        bones['Spine'].rotation_quaternion = world_axis('Spine', (0, 1, 0), .05 * direction) @ world_axis('Spine', (0, 0, 1), -.06 * direction) @ bones['Spine'].rotation_quaternion
        right_x, right_lift = foot_path(t, 0, direction); left_x, left_lift = foot_path(t, .5, direction)
        targets = {'Left': Vector((CENTER + STANCE + left_x, rest('LeftFoot').y, rest('LeftFoot').z + left_lift)),
                   'Right': Vector((CENTER - STANCE + right_x, rest('RightFoot').y, rest('RightFoot').z + right_lift))}
        # Baixa o quadril só o necessário para o pé mais aberto alcançar o chão; o peso acompanha o pé de apoio.
        sway = -.006 * wave
        reach = 0
        for side, target in targets.items():
            hip = rest(side + 'UpLeg')
            spread = target.x - hip.x - sway
            reach = max(reach, hip.z - rest(side + 'Foot').z - math.sqrt(LEG_LENGTH ** 2 - spread ** 2))
        bpy.context.view_layer.update()
        hip = bones['Hips']; matrix = hip.matrix.copy(); matrix.translation += Vector((sway, 0, -max(.022, reach + .006))); hip.matrix = matrix
        bpy.context.view_layer.update()
        for side, target in targets.items():
            leg_pose(rig, side, target, target + Vector((0, -.20, .12)))
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
            b.keyframe_insert('location', frame=frame, group=b.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for channel in bag.fcurves:
                    for key in channel.keyframe_points:
                        key.interpolation = 'BEZIER'; key.handle_left_type = 'AUTO_CLAMPED'; key.handle_right_type = 'AUTO_CLAMPED'
    track = rig.animation_data.nla_tracks.new(); track.name = name; track.strips.new(name, 1, action); track.mute = True

previous = rig.animation_data.action; previous_frame = scene.frame_current
for track in list(rig.animation_data.nla_tracks):
    if track.name.startswith('strafe_'):
        action = track.strips[0].action; rig.animation_data.nla_tracks.remove(track); bpy.data.actions.remove(action)
idle = sample_action('idle', [1]); walk = sample_action('walk', range(1, FRAMES + 1))
bake('strafe_left', 1, idle, walk)    # esquerda do personagem = +X
bake('strafe_right', -1, idle, walk)
rig.animation_data.action = previous
scene.frame_set(previous_frame)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models/warrior.blend'))
print('WARRIOR_STRAFE', [t.name for t in rig.animation_data.nla_tracks])
