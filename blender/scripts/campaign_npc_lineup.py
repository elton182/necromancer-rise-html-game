"""Apresenta os seis NPCs de frente, sem substituir a cena de trabalho aberta.
Execute este arquivo no Blender; as cenas individuais continuam independentes.
"""
import math
from pathlib import Path
import bpy
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes.new('NPCs — fila frontal')
bpy.context.window.scene = scene
for i, (ident, label) in enumerate([
    ('joao', 'João'), ('marta', 'Marta'), ('helena', 'Helena'),
    ('guard', 'Guarda'), ('messenger', 'Tomás'), ('mayor', 'Joaquim'),
]):
    with bpy.data.libraries.load(str(ROOT / 'models' / f'campaign_{ident}.blend'), link=False) as (src, dst):
        dst.objects = src.objects
    for obj in dst.objects:
        if obj:
            scene.collection.objects.link(obj)
            if obj.type == 'MESH':
                for mat in obj.data.materials:
                    if mat and mat.use_nodes:
                        shader = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                        if shader:
                            mat.diffuse_color = shader.inputs['Base Color'].default_value
    for obj in dst.objects:
        if obj and obj.type == 'ARMATURE':
            obj.name = 'Fila_' + ident
            obj.location = ((i - 2.5) * 1.75, 0, 0)
            obj.rotation_euler = (0, 0, 0)
            obj.show_in_front = False
            obj.hide_set(True)  # Apenas os ossos; as malhas continuam visíveis.
    curve = bpy.data.curves.new('Nome_' + ident, 'FONT')
    curve.body = label
    curve.align_x = 'CENTER'
    curve.size = .20
    text = bpy.data.objects.new('Nome_' + ident, curve)
    scene.collection.objects.link(text)
    text.location = ((i - 2.5) * 1.75, -.10, -.35)
    text.rotation_euler = (math.pi / 2, 0, 0)

scene.frame_set(1)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.region_3d.view_rotation = Quaternion((1, 0, 0), math.pi / 2)
            space.region_3d.view_perspective = 'ORTHO'
            space.region_3d.view_location = Vector((0, 0, 1.05))
            space.region_3d.view_distance = 8.4
            space.overlay.show_overlays = False
            space.shading.type = 'SOLID'
            space.shading.color_type = 'MATERIAL'
            space.shading.light = 'STUDIO'

# Grava apenas esta cena, preservando outras cenas e o arquivo aberto do usuário.
bpy.data.libraries.write(str(ROOT / 'models' / 'campaign_npc_lineup.blend'), {scene}, fake_user=True)
print('Fila frontal criada: João, Marta, Helena, Guarda, Tomás e Joaquim.')
