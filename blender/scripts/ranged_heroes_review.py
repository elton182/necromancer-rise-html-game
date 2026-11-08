"""Prancha de revisão dos clipes da Arqueira e do Mercenário (EEVEE, sem tocar no export).

Uso: blender --background models/<id>.blend --python blender/scripts/ranged_heroes_review.py -- <saida.png> [vista]
Vistas: front (padrão), side, iso (próxima da câmera do jogo).
"""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
out = Path(args[0])
view = args[1] if len(args) > 1 else 'front'
scene = bpy.context.scene
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
direction = {'front': Vector((0, -1, 0.12)), 'side': Vector((1, 0, 0.12)), 'iso': Vector((0.7, -0.7, 1.0))}[view].normalized()
cam = bpy.data.objects.new('ReviewCam', bpy.data.cameras.new('ReviewCam'))
scene.collection.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.45
target = Vector((0, 0, 0.48))
cam.location = target + direction * 4
cam.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam
sun = bpy.data.objects.new('ReviewSun', bpy.data.lights.new('ReviewSun', 'SUN'))
sun.data.energy = 3.5
sun.rotation_euler = (0.7, 0.2, 0.6)
scene.collection.objects.link(sun)
world = bpy.data.worlds.new('ReviewWorld')
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs[0].default_value = (0.42, 0.44, 0.48, 1)
for engine in ('BLENDER_EEVEE_NEXT', 'BLENDER_EEVEE', 'BLENDER_WORKBENCH'):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        pass
scene.render.resolution_x = scene.render.resolution_y = 256
scene.render.film_transparent = False
plane = bpy.data.objects.new('ReviewGround', bpy.data.meshes.new('ReviewGround'))
plane.data.from_pydata([(-2, -2, 0), (2, -2, 0), (2, 2, 0), (-2, 2, 0)], [], [(0, 1, 2, 3)])
scene.collection.objects.link(plane)
tiles = []
tmp = out.parent / (out.stem + '_tmp')
tmp.mkdir(parents=True, exist_ok=True)
for track in rig.animation_data.nla_tracks:
    action = track.strips[0].action
    rig.animation_data.action = action
    start, end = [int(x) for x in action.frame_range]
    picks = sorted({start, start + (end - start) // 4, start + (end - start) // 2, start + 3 * (end - start) // 4, end})
    for i, f in enumerate(picks):
        scene.frame_set(f)
        path = tmp / f'{track.name}_{i}.png'
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        tiles.append((track.name, i, path))
print('REVIEW', len(tiles), 'quadros em', tmp)
