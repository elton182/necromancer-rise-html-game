"""Falcão da Arqueira: rig Tripo do usuário, corpo inclinado para o voo e três clipes.

Uso, na raiz do projeto:
  blender --background --python blender/scripts/falcon.py
Pelo MCP, sobre um arquivo vazio: execute este arquivo; só remove objetos e ações marcados `falcon_asset`.

Fonte: blender/reference/falcon/falcon_source.glb (pose ereta, asas abertas, frente em -Y).
Clipes in-place a 30 fps: `idle` (batida de asas em loop; o renderizador só repete o `idle`), `glide`
(planar) e `dive` (asas recolhidas, garras à frente, golpe). A altura de voo e o deslocamento ficam no jogo.
"""
from pathlib import Path
import math
import bpy
from mathutils import Euler, Vector

ROOT = Path(__file__).resolve().parents[1]
if bpy.app.background:
    bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
for o in [o for o in scene.objects if o.get('falcon_asset')]:
    bpy.data.objects.remove(o, do_unlink=True)
for a in [a for a in bpy.data.actions if a.get('falcon_asset') and a.users == 0]:
    bpy.data.actions.remove(a)

before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'reference/falcon/falcon_source.glb'))
new = [o for o in bpy.data.objects if o not in before]
rig = next(o for o in new if o.type == 'ARMATURE')
body = max((o for o in new if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
for o in new:
    if o not in (rig, body):
        bpy.data.objects.remove(o, do_unlink=True)
rig.name, body.name = 'FalconRig', 'FalconBody'
for o in (rig, body):
    o['falcon_asset'] = True
for mat in body.data.materials:
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image and n.image.size[0] > 1024:
            n.image.scale(1024, 1024)
            n.image.pack()
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = 0.8

B = {b.name: b for b in rig.pose.bones}
ALIAS = {'root': 'tripo::Root', 'chest': 'bone_1', 'head': 'tripo::Head_0', 'tail0': 'tripo::Spine_0', 'tail1': 'tripo::Spine_1',
         'tail2': 'tripo::Spine_2', 'wingL': 'bone_6', 'tipL': 'bone_7', 'wingR': 'bone_8', 'tipR': 'bone_9',
         'hipL': 'bone_10', 'legL': 'tripo::0_Left_Limb_0', 'hipR': 'bone_13', 'legR': 'tripo::0_Right_Limb_0'}


def rot(key, angles):
    """Rotação em eixos do repouso (X lateral, Y costas, Z eixo do corpo), relativa ao pai."""
    b = B[ALIAS[key]]
    basis = b.bone.matrix_local.to_quaternion()
    b.rotation_mode = 'QUATERNION'
    b.rotation_quaternion = basis.inverted() @ Euler(angles).to_quaternion() @ basis


def pose(name, t):
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = (1, 0, 0, 0)
        b.location = (0, 0, 0)
    wave = math.sin(t * math.tau)
    if name == 'idle':
        # Batida: descida mais rápida que a subida; a ponta atrasa em relação ao braço.
        down = math.sin(t * math.tau + 0.4 * math.sin(t * math.tau))
        flap, tip = 0.85 * down, 0.45 * math.sin(t * math.tau - 0.9)
        pitch, bob = 1.35, 0.02 * -down
    elif name == 'glide':
        # Planar: asas quase paradas, pequenas correções e respiração.
        flap, tip = 0.10 + 0.06 * wave, 0.05 * math.sin(t * math.tau - 1)
        pitch, bob = 1.38, 0.012 * wave
    else:  # dive
        fold = min(1, t / 0.45)
        strike = max(0.0, min(1.0, (t - 0.45) / 0.2)) * (1 - max(0.0, (t - 0.75) / 0.25))
        flap, tip = -0.2 * fold + 0.9 * strike, -0.9 * fold + 0.6 * strike
        pitch, bob = 1.38 + 0.35 * fold - 0.5 * strike, 0.0
    rot('root', (pitch, 0, 0))
    B[ALIAS['root']].location = (0, bob, 0)
    rot('wingL', (0, 0, flap))
    rot('tipL', (0, 0, tip))
    rot('wingR', (0, 0, -flap))
    rot('tipR', (0, 0, -tip))
    # Cabeça e pescoço compensam a inclinação para olhar à frente.
    rot('chest', (-0.55, 0, 0))
    rot('head', (-0.35 + 0.05 * wave, 0, 0))
    rot('tail0', (-0.95 + 0.05 * wave, 0, 0))
    if name == 'dive':
        talons = max(0.0, min(1.0, (t - 0.3) / 0.3))
        for k in ('hipL', 'hipR'):
            rot(k, (-1.2 * talons + 0.9 * (1 - talons), 0, 0))
    else:
        for k in ('hipL', 'hipR'):
            rot(k, (0.9, 0, 0))
        for k in ('legL', 'legR'):
            rot(k, (0.6, 0, 0))


rig.animation_data_clear()
rig.animation_data_create()
CLIPS = [('idle', 17), ('glide', 61), ('dive', 16)]
for name, frames in CLIPS:
    action = bpy.data.actions.new(name)
    action['falcon_asset'] = True
    rig.animation_data.action = action
    for frame in range(1, frames + 1):
        scene.frame_set(frame)
        t = (frame - 1) / (frames - 1)
        pose(name, 0.0 if name != 'dive' and frame == frames else t)
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
            b.keyframe_insert('location', frame=frame, group=b.name)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, action)
    track.mute = True
    rig.animation_data.action = None

body.data.calc_loop_triangles()
print('FALCÃO', len(body.data.loop_triangles), 'triângulos')
for tr in rig.animation_data.nla_tracks:
    tr.mute = False
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'exports/falcon.glb'), use_selection=True, export_format='GLB',
                          export_animations=True, export_animation_mode='NLA_TRACKS', export_image_format='JPEG', export_image_quality=82)
for tr in rig.animation_data.nla_tracks:
    tr.mute = True
rig.animation_data.action = bpy.data.actions['idle']
scene.frame_start, scene.frame_end = 1, 17
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models/falcon.blend'))
print('Falcão:', len(CLIPS), 'clipes exportados para exports/falcon.glb')
