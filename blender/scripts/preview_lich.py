"""Prévias de revisão do Lich: renderiza quadros-chave de cada clipe de models/v2_lich.blend em previews/lich/.
Uso: blender --background --python blender/scripts/preview_lich.py [-- clip:quadro ...]"""
from pathlib import Path
import bpy, sys
from mathutils import Vector
BASE = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE / 'models/v2_lich.blend'))
sc = bpy.context.scene
engines = [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'BLENDER_EEVEE_NEXT'
sc.render.film_transparent = False
sc.render.resolution_x = sc.render.resolution_y = 480
sc.world = bpy.data.worlds.new('PreviewWorld')
sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (.32, .33, .38, 1)
bpy.ops.object.light_add(type='SUN', location=(0, -3, 5))
bpy.context.object.data.energy = 3.2
bpy.context.object.rotation_euler = (.9, 0, .5)
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
view = next((a.split('=')[1] for a in args if a.startswith('view=')), 'threeq')
zoom = float(next((a.split('=')[1] for a in args if a.startswith('zoom=')), 2.0))
args = [a for a in args if not a.startswith(('view=', 'zoom='))]
bpy.ops.object.camera_add(location={'threeq': (1.7, -2.6, 1.0), 'front': (0, -3.2, 1.0), 'side': (-3.2, 0, 1.0), 'top': (0, -.6, 4.0)}[view])
cam = bpy.context.object
cam.rotation_euler = (Vector((0, 0, .6 if zoom >= 2 else .75)) - cam.location).to_track_quat('-Z', 'Y' if view != 'top' else 'Y').to_euler()
cam.data.type = 'ORTHO'
cam.data.ortho_scale = zoom
sc.camera = cam
for o in sc.objects:
    if o.name == 'LichScytheProjectile':
        o.hide_render = True
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
out = BASE / 'previews/lich'
out.mkdir(parents=True, exist_ok=True)
default = ['idle:1', 'walk:7', 'slash:4', 'slash:10', 'slash:15', 'combo_2:4', 'combo_2:10', 'combo_3:8', 'combo_3:16', 'combo_3:24', 'combo_3:31',
           'throw:7', 'throw:10', 'throw:14', 'catch:6', 'sweep:8', 'sweep:13', 'spin:7', 'transform:3', 'transform:18', 'transform:30', 'hit:4', 'death:12', 'death:22', 'death:31']
for spec in args or default:
    name, f = spec.split(':')
    action = bpy.data.actions[name]
    arm.animation_data.action = action
    arm.animation_data.action_slot = action.slots[0]
    sc.frame_set(int(f))
    sc.render.filepath = str(out / (f'lich_{name}_{f}.png' if view == 'threeq' else f'lich_{view}_{name}_{f}.png'))
    bpy.ops.render.render(write_still=True)
print('PREVIEW_DONE')
