"""Acrescenta `dodge` à cena do Lich: rasante em parafuso, sem alterar as demais ações.

Rode depois de lich.py, que recria a cena sem este clipe. Com models/v2_lich.blend aberto no Blender (MCP), ou na raiz:
  blender --background blender/models/v2_lich.blend --python blender/scripts/lich_dodge.py
Grava models/v2_lich.blend e exports/v2_lich.glb (a foice solta, exports/v2_lich_scythe.glb, não muda); depois: node v2/tools/build.cjs.
O Lich voa, então não rola no chão: deita o corpo na direção da esquiva, varre os braços para trás e dá uma volta em torno do próprio eixo, com a foice girando atrás dele.
O giro entra por último no quadril, levando o corpo inteiro. A duração no jogo (0,5 s) vem do registro `durations` de v2/assets/models.json.
"""
from pathlib import Path
import math
import bpy
import numpy as np
from mathutils import Vector, Quaternion, Matrix
ROOT = Path(__file__).resolve().parents[1]
FRAMES = 24
PITCH = 1.3             # o corpo quase na horizontal, cabeça à frente
LOW = .5                # altura do quadril no rasante, em unidades do modelo (corpo = 1,0)
SCYTHE_AT = Vector((0, .3, .74))   # atrás e acima do corpo; frente = -Y
SCYTHE_TURNS = 2        # voltas da foice em torno do próprio cabo
scene = bpy.context.scene
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
body = bpy.data.objects['LichBody']
def bone(name): return arm.pose.bones['mixamorig:' + name]
def ease(u): u = max(0, min(1, u)); return u * u * (3 - 2 * u)
def axis_turn(b, axis, angle):
    q = b.bone.matrix_local.to_quaternion()
    return q.inverted() @ Quaternion(axis, angle) @ q
# (osso, eixo do repouso, ângulo no auge do rasante)
LIMBS = (('Hips', (1, 0, 0), PITCH), ('Spine', (1, 0, 0), .06), ('Spine1', (1, 0, 0), .06), ('Neck', (1, 0, 0), -.55), ('Head', (1, 0, 0), -.45),
         ('LeftUpLeg', (1, 0, 0), .22), ('RightUpLeg', (1, 0, 0), .3), ('LeftLeg', (1, 0, 0), .5), ('RightLeg', (1, 0, 0), .34),
         ('LeftArm', (1, 0, 0), 1.05), ('RightArm', (1, 0, 0), 1.05), ('LeftArm', (0, 1, 0), -.25), ('RightArm', (0, 1, 0), .25),
         ('LeftForeArm', (1, 0, 0), .55), ('RightForeArm', (1, 0, 0), .55))

previous_frame = scene.frame_current
arm.animation_data.action = bpy.data.actions['idle']
for action in [a for a in bpy.data.actions if a.name == 'dodge']: bpy.data.actions.remove(action); arm.animation_data.action_slot = bpy.data.actions['idle'].slots[0]
scene.frame_set(1); bpy.context.view_layer.update()
idle = {b.name: (b.rotation_quaternion.copy(), b.location.copy(), b.scale.copy()) for b in arm.pose.bones}
scythe = arm.pose.bones['Scythe']; scythe_idle = scythe.matrix.copy()
hips = bone('Hips'); hips_z = hips.matrix.translation.z

action = bpy.data.actions.new('dodge'); action.use_fake_user = True; action['loop'] = False
arm.animation_data.action = action
lowest = []
for f in range(FRAMES + 1):
    u = f / FRAMES
    k = ease(u / .22) * (1 - ease((u - .72) / .28))
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion, b.location, b.scale = idle[b.name]
    for name, axis, angle in LIMBS:
        b = bone(name); b.rotation_quaternion = axis_turn(b, axis, angle * k) @ b.rotation_quaternion
    bpy.context.view_layer.update()
    m = hips.matrix.copy(); m.translation.z = hips_z + (LOW - hips_z) * k; hips.matrix = m
    # A volta em torno do eixo de voo fica por fora de tudo.
    hips.rotation_quaternion = axis_turn(hips, (0, 1, 0), math.tau * ease((u - .12) / .68)) @ hips.rotation_quaternion
    # Foice: do lado do corpo para trás dele; o cabo aponta contra o voo e gira sobre si.
    spin = math.tau * SCYTHE_TURNS * ease((u - .08) / .8)
    d = Vector((0, 1, .1)).normalized(); b = Quaternion(d, spin) @ Vector((1, 0, 0)); x = (b - d * b.dot(d)).normalized(); z = x.cross(d)
    fly = Matrix(((x.x, d.x, z.x, SCYTHE_AT.x), (x.y, d.y, z.y, SCYTHE_AT.y), (x.z, d.z, z.z, SCYTHE_AT.z), (0, 0, 0, 1)))
    l0, q0, _ = scythe_idle.decompose(); l1, q1, _ = fly.decompose()
    scythe.matrix = Matrix.LocRotScale(l0.lerp(l1, k), q0.slerp(q1, k), Vector((1, 1, 1)))
    bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); ev.to_mesh_clear()
    M = np.array(ev.matrix_world); lowest.append(float((co.reshape(-1, 3) @ M[:3, :3].T + M[:3, 3])[:, 2].min()))
    for b in arm.pose.bones:
        b.keyframe_insert('rotation_quaternion', frame=f + 1)
        if b.name.endswith('Hips') or b.name == 'Scythe': b.keyframe_insert('location', frame=f + 1)
        if b.name == 'Scythe': b.keyframe_insert('scale', frame=f + 1)
arm.animation_data.action = bpy.data.actions['idle']; arm.animation_data.action_slot = bpy.data.actions['idle'].slots[0]
scene.frame_set(previous_frame)
bpy.ops.object.select_all(action='DESELECT')
for o in [arm, *arm.children_recursive]: o.hide_set(False); o.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'exports/v2_lich.glb'), export_format='GLB', use_selection=True, export_yup=True, export_animation_mode='ACTIONS', export_skins=True, export_force_sampling=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models/v2_lich.blend'))
print('LICH_DODGE', sorted(a.name for a in bpy.data.actions), 'ponto mais baixo do corpo', round(min(lowest), 3))
