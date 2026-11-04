"""Alonga a passada do `walk` do Guerreiro: troca só pernas e altura do quadril, preservando tronco e braços (poses manuais do usuário).

Uso na raiz: blender --background blender/models/warrior.blend --python blender/scripts/warrior_walk_stride.py
Grava models/warrior.blend; para publicar, execute scripts/warrior_equipment_export.py via MCP e depois node v2/tools/build.cjs.
O avanço por ciclo fica no registro `stride` de v2/assets/models.json. A velocidade da perna vem de velocidade ÷ passada, não do número de quadros: a 4 u/s,
só uma passada maior reduz a cadência. Sem o manto do necromante, as pernas ficam à mostra e denunciam a pressa. Uma passada longa com o pé no chão metade do
tempo abriria demais as pernas, então cada pé apoia só parte do ciclo e há um breve instante no ar, como numa corridinha.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
rig = bpy.data.objects['WarriorRig']
namespace = {}
exec(compile((ROOT / 'scripts/warrior_pose.py').read_text(encoding='utf-8'), str(ROOT / 'scripts/warrior_pose.py'), 'exec'), namespace)
leg_pose = namespace['leg_pose']

FRAMES = 25
WORLD_SCALE = 2.25 / .72
STRIDE = 2.2      # avanço por ciclo no jogo
STANCE = .34      # fração do ciclo com cada pé no chão; o pé recua STRIDE × STANCE nesse tempo, sem escorregar
REACH = STRIDE * STANCE / 2 / WORLD_SCALE
LIFT = .06
HIP_DROP = .038   # o suficiente para o pé alcançar o chão nos extremos da passada; mais que isso flexiona os joelhos e abre as pernas
FOOT_WIDTH = .012 # afastamento lateral do pé em relação à articulação do quadril; o pé em repouso do modelo fica bem mais aberto
LEG_BONES = ('UpLeg', 'Leg', 'Foot', 'ToeBase', 'Toe_End')
bones = {b.name.split(':')[-1]: b for b in rig.pose.bones}
def ease(u): return u * u * (3 - 2 * u)
def foot_path(t, offset):
    # Fase 0,25 é o meio do apoio, como antes da mudança; os braços continuam em sincronia. +Y é para trás.
    phase = (t + offset - .25 + STANCE / 2) % 1
    if phase < STANCE:
        u = phase / STANCE
        return REACH * (2 * u - 1), 0, .08 * (1 - 2 * u)
    u = (phase - STANCE) / (1 - STANCE)
    return REACH * (1 - 2 * ease(u)), LIFT * math.sin(math.pi * u), -.2 * math.sin(math.pi * u)

track = next(t for t in rig.animation_data.nla_tracks if t.name == 'walk')
previous = rig.animation_data.action; previous_frame = scene.frame_current
action = track.strips[0].action
rig.animation_data.action = action
def is_leg(bone): return bone.name.split(':')[-1].removeprefix('Left').removeprefix('Right') in LEG_BONES
legs = [b for b in rig.pose.bones if is_leg(b)]
for frame in range(1, FRAMES + 1):
    scene.frame_set(frame)
    t = (frame - 1) / (FRAMES - 1)
    for b in legs:
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = (1, 0, 0, 0); b.location = (0, 0, 0)
    hip = bones['Hips']; hip.location = (0, 0, 0)
    bpy.context.view_layer.update()
    matrix = hip.matrix.copy(); matrix.translation += Vector((.004 * math.sin(t * math.tau), 0, -HIP_DROP + .004 * math.cos(t * math.tau * 2))); hip.matrix = matrix
    bpy.context.view_layer.update()
    for side, sign, offset in (('Right', -1, 0), ('Left', 1, .5)):
        y, z, pitch = foot_path(t, offset)
        rest = bones[side + 'Foot'].bone.head_local; joint = bones[side + 'UpLeg'].bone.head_local
        # A passada fica centrada na articulação do quadril, para os dois extremos caberem no comprimento da perna.
        target = Vector((joint.x + sign * FOOT_WIDTH, joint.y + sign * -.02 + y, rest.z + z))
        leg_pose(rig, side, target, target + Vector((0, -.20, .12)), pitch, 0)
    for b in legs:
        b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
        b.keyframe_insert('location', frame=frame, group=b.name)
    hip.keyframe_insert('location', frame=frame, group=hip.name)
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for channel in bag.fcurves:
                for key in channel.keyframe_points:
                    key.interpolation = 'BEZIER'; key.handle_left_type = 'AUTO_CLAMPED'; key.handle_right_type = 'AUTO_CLAMPED'
rig.animation_data.action = previous
scene.frame_set(previous_frame)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models/warrior.blend'))
print('WARRIOR_WALK_STRIDE', STRIDE, 'reach', round(REACH, 4))
