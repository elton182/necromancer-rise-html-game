"""Acrescenta `dodge` à cena autoral do Guerreiro: rolamento de combate, sem alterar as demais ações.

Uso na raiz: blender --background blender/models/warrior.blend --python blender/scripts/warrior_dodge.py
Grava models/warrior.blend; para publicar: blender --background --factory-startup --python blender/scripts/warrior_equipment_export.py e depois node v2/tools/build.cjs.
Encolhe, dá uma volta inteira para a frente e levanta em guarda. A pose encolhida é montada em pé (IK de warrior_pose.py) e o giro entra por último no quadril,
levando o corpo inteiro junto. A espada fica quase paralela ao eixo do giro e o escudo vai colado à lateral esquerda, como uma roda: nenhum dos dois raspa o chão.
A duração no jogo (0,5 s) vem do registro `durations` de v2/assets/models.json.
"""
from pathlib import Path
import math
import bpy
import numpy as np
from mathutils import Vector, Quaternion, Matrix
ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
rig = bpy.data.objects['WarriorRig']
body = bpy.data.objects['WarriorBody']
namespace = {}
exec(compile((ROOT / 'scripts/warrior_pose.py').read_text(encoding='utf-8'), str(ROOT / 'scripts/warrior_pose.py'), 'exec'), namespace)
arm_pose, leg_pose = namespace['arm_pose'], namespace['leg_pose']

FRAMES = 25
SPIN_START, SPIN_END = .1, .78     # fração do clipe em que o corpo dá a volta; os mesmos tempos do rolamento do necromante
# (fração do clipe, pose)
TIMING = ((0, 'idle'), (.12, 'dip'), (.3, 'tuck'), (.62, 'tuck'), (.84, 'rise'), (1, 'idle'))
CURL = {'Spine': .62, 'Spine1': .36, 'Spine2': .3, 'Neck': .2, 'Head': .32}
RIGHT_HAND, RIGHT_ELBOW = (-.12, .275, .49), (-.29, .46, .44)     # em repouso do tronco, antes de encolher; frente = -Y
LEFT_HAND, LEFT_ELBOW = (.155, .335, .47), (.22, .5, .42)
BLADE = (-.92, .32, .2)            # lâmina para a direita, levemente para trás
SHIELD_TURN = 1.25                 # giro em torno de Z que tira o escudo da frente e o cola à lateral esquerda
bones = {b.name.split(':')[-1]: b for b in rig.pose.bones}
def ease(u): u = max(0, min(1, u)); return u * u * (3 - 2 * u)

def read_action(name, frame):
    rig.animation_data.action = next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name == name)
    scene.frame_set(frame); bpy.context.view_layer.update()
    return {b.name: (b.rotation_quaternion.copy(), b.location.copy()) for b in rig.pose.bones}

def clear_pose():
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = Quaternion(); b.location = (0, 0, 0); b.scale = (1, 1, 1)

def rest_axis(key, axis, angle):
    q = bones[key].bone.matrix_local.to_quaternion()
    return q.inverted() @ Quaternion(axis, angle) @ q

def curled(legs, curl):
    """Monta tronco, pernas e braços com o corpo em pé; devolve a pose local de todos os ossos."""
    clear_pose()
    for key, angle in CURL.items(): bones[key].rotation_quaternion = rest_axis(key, (1, 0, 0), angle * curl)
    bpy.context.view_layer.update()
    for side, (foot, pole, pitch) in legs.items(): leg_pose(rig, side, foot, pole, pitch=pitch)
    chest = bones['Spine2'].matrix @ bones['Spine2'].bone.matrix_local.inverted()
    turn = chest.to_quaternion()
    arm_pose(rig, 'Right', chest @ Vector(RIGHT_HAND), chest @ Vector(RIGHT_ELBOW), turn @ Vector(BLADE))
    arm_pose(rig, 'Left', chest @ Vector(LEFT_HAND), chest @ Vector(LEFT_ELBOW))
    hand = bones['LeftHand']; bpy.context.view_layer.update()
    hand.matrix = Matrix.LocRotScale(hand.head, turn @ Quaternion((0, 0, 1), SHIELD_TURN) @ hand.bone.matrix_local.to_quaternion(), Vector((1, 1, 1)))
    bpy.context.view_layer.update()
    return {b.name: (b.rotation_quaternion.copy(), b.location.copy()) for b in rig.pose.bones}

def mix(a, b, t):
    return {k: (a[k][0].slerp(b[k][0], t), a[k][1].lerp(b[k][1], t)) for k in a}

def lowest():
    bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); ev.to_mesh_clear()
    M = np.array(rig.matrix_world.inverted() @ ev.matrix_world)
    return float((co.reshape(-1, 3) @ M[:3, :3].T + M[:3, 3])[:, 2].min())

def foot(side, forward, up):
    rest = bones[side + 'Foot'].bone.head_local; inward = -.035 if rest.x > 0 else .035
    return Vector((rest.x + inward, rest.y - forward, rest.z + up))
def knee(target, height=.17): return target + Vector((0, -.3, height))

previous = rig.animation_data.action; previous_frame = scene.frame_current
if previous and previous.name == 'dodge': previous = None   # o clipe anterior será substituído
for track in list(rig.animation_data.nla_tracks):
    if track.name == 'dodge':
        action = track.strips[0].action; rig.animation_data.nla_tracks.remove(track); bpy.data.actions.remove(action)
for action in [a for a in bpy.data.actions if a.name == 'dodge']: bpy.data.actions.remove(action)
for track in rig.animation_data.nla_tracks: track.mute = True

idle = read_action('idle', 1)
floor = lowest()
rig.animation_data.action = None
L, R = foot('Left', .02, .21), foot('Right', .02, .21)
tuck = curled({'Left': (L, knee(L, .3), .3), 'Right': (R, knee(R, .3), .3)}, 1)
L, R = foot('Left', .12, .13), foot('Right', -.08, .08)
dip = curled({'Left': (L, knee(L), .1), 'Right': (R, knee(R, .1), .2)}, .55)
L, R = foot('Left', -.07, .08), foot('Right', .1, .13)
rise = curled({'Left': (L, knee(L, .1), .2), 'Right': (R, knee(R), .1)}, .4)
poses = {'idle': idle, 'dip': mix(idle, dip, .8), 'tuck': tuck, 'rise': mix(idle, rise, .75)}

action = bpy.data.actions.new('dodge'); action['warrior_asset'] = True
rig.animation_data.action = action
hip = bones['Hips']; heights = []
for frame in range(1, FRAMES + 1):
    u = (frame - 1) / (FRAMES - 1)
    for (t0, a), (t1, b) in zip(TIMING, TIMING[1:]):
        if u <= t1: pose = mix(poses[a], poses[b], ease((u - t0) / (t1 - t0))); break
    scene.frame_set(frame)
    for b in rig.pose.bones: b.rotation_quaternion, b.location = pose[b.name]
    hip.rotation_quaternion = rest_axis('Hips', (1, 0, 0), math.tau * ease((u - SPIN_START) / (SPIN_END - SPIN_START))) @ hip.rotation_quaternion
    # O ponto mais baixo do corpo apoia no chão, dos pés às costas.
    low = lowest() - floor; bpy.context.view_layer.update()
    matrix = hip.matrix.copy(); matrix.translation.z -= low; hip.matrix = matrix
    heights.append(round(lowest() - floor, 4))
    for b in rig.pose.bones:
        b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
        b.keyframe_insert('location', frame=frame, group=b.name)
track = rig.animation_data.nla_tracks.new(); track.name = 'dodge'; track.strips.new('dodge', 1, action); track.mute = True
rig.animation_data.action = previous
scene.frame_set(previous_frame)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models/warrior.blend'))
print('WARRIOR_DODGE', [t.name for t in rig.animation_data.nla_tracks], 'erro de apoio', min(heights), max(heights))
