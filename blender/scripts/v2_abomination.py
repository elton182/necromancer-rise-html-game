"""Abominação provisória da migração: derivação volumosa do rig low-poly.
Não altera o zumbi original. Arte dedicada permanece identificada como pendente.
"""
from pathlib import Path
import bpy
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/lowpoly_zombie.blend'))
sc=bpy.context.scene
bpy.ops.object.select_all(action='DESELECT')
for o in sc.objects:
    if o.type in ('MESH','ARMATURE'):
        o.select_set(True)
        if o.parent is None:o.scale.x*=1.65;o.scale.y*=1.3;o.scale.z*=1.2
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/v2_abomination.blend'))
bpy.ops.export_scene.gltf(filepath=str(BASE/'exports/v2_abomination.glb'),export_format='GLB',use_selection=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True)
print('V2_ABOMINATION_PROVISIONAL_OK')
