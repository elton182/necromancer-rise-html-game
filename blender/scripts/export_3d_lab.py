"""Exporta cópias para o laboratório 3D, sem salvar/alterar as cenas originais.
blender --background --threads 4 --python blender/scripts/export_3d_lab.py
"""
from pathlib import Path
import bpy, json, sys
BASE = Path(__file__).resolve().parents[1]
models = [('rigged_player', 'lab_player_current'), ('boss_fallenKing_v4', 'lab_fallen_king_v4')]
only = next((arg.split('=', 1)[1] for arg in sys.argv if arg.startswith('--only=')), None)
if only and only not in {source for source, _ in models}:
    raise ValueError('Cena desconhecida: ' + only)
for source, target in models:
    if only and source != only:
        continue
    bpy.ops.wm.open_mainfile(filepath=str(BASE/'models'/f'{source}.blend'))
    sc = bpy.context.scene
    bpy.ops.object.select_all(action='DESELECT')
    for obj in sc.objects:
        # A cena do player contém uma esfera auxiliar sem material, fora do rig.
        if obj.type in ('MESH', 'ARMATURE', 'EMPTY') and not obj.hide_render and obj.name != 'Icosphere':
            obj.hide_set(False)
            obj.select_set(True)
    sc.render.fps = 24
    for obj in sc.objects:
        if obj.type == 'ARMATURE' and obj.animation_data:
            action = bpy.data.actions.get('idle')
            if action:
                obj.animation_data.action = action
                if action.slots:
                    obj.animation_data.action_slot = action.slots[0]
    sc.frame_set(1)
    bpy.ops.export_scene.gltf(filepath=str(BASE/'exports'/f'{target}.glb'),
        export_format='GLB', use_selection=True, export_animation_mode='ACTIONS',
        export_skins=True, export_yup=True, export_force_sampling=True)
    print('LAB_EXPORT', json.dumps({'source': source, 'target': target,
        'actions': [a.name for a in bpy.data.actions]}))
