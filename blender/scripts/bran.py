from pathlib import Path
import bpy, math
root=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'reference/bran/blacksmith.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
# Respiração discreta no tronco, sem deslocar pés nem alterar a pose importada.
bone=next((b for b in rig.pose.bones if 'spine' in b.name.lower()),None)
if bone is None: bone=rig.pose.bones[0]
bone.rotation_mode='XYZ'
base=bone.rotation_euler.copy()
for frame,angle in [(1,0),(31,.012),(61,0)]:
 bone.rotation_euler=base.copy();bone.rotation_euler.x+=angle
 bone.keyframe_insert(data_path='rotation_euler',frame=frame)
rig.animation_data.action.name='idle'
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=61;bpy.context.scene.render.fps=30
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'models/bran.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'exports/bran.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS')
