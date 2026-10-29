"""Osso inteiro do projétil 3D; cria somente saídas novas v2_bone.*.
blender --background --threads 4 --python blender/scripts/v2_bone.py
Eixo +X. Sem rig, câmeras, luzes ou recursos externos no GLB.
"""
from pathlib import Path
import sys,bpy
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'scripts'))
import common as C
C.reset_scene()
C.mat('ivory','#f1e5c4',gain=1.0)
C.mat('highlight','#fff7df',gain=1.0)
C.seg((-.23,0,0),(.23,0,0),.045,.045,'ivory','bone',8,True)
for x in (-.25,.25):
    for y in (-.045,.045):C.sphere((x,y,0),.065,(1,1,.85),'ivory','bone',10)
C.seg((-.19,0,.038),(.19,0,.038),.012,.012,'highlight','bone',6)
bpy.ops.object.select_all(action='DESELECT')
for o in C.PARTS:o.select_set(True)
bpy.context.view_layer.objects.active=C.PARTS[0]
bpy.ops.object.join()
bone=bpy.context.object;bone.name='V2Bone'
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/v2_bone.blend'))
bpy.ops.export_scene.gltf(filepath=str(BASE/'exports/v2_bone.glb'),export_format='GLB',use_selection=True,export_yup=True)
print('V2_BONE_OK',len(bone.data.vertices))
