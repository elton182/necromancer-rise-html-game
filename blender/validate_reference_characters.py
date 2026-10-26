"""Reimport every shipped GLB and inspect skinning, UVs, clips and evaluated poses."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent/'reference';report={}
for path in sorted(HERE.glob('*.glb')):
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(path))
 rigs=[o for o in bpy.context.scene.objects if o.type=='ARMATURE'];meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and any(m.type=='ARMATURE' for m in o.modifiers)];assert len(rigs)==1 and meshes,path.name
 arm=rigs[0];expected=json.loads(path.with_name(path.stem+'_model.json').read_text());actions=list(bpy.data.actions);assert set(expected['actions']).issubset({a.name.removesuffix('_Rig') for a in actions}),(path.name,[a.name for a in actions])
 assert all(m.data.uv_layers for m in meshes),path.name
 for m in meshes:
  for v in m.data.vertices:assert abs(sum(g.weight for g in v.groups)-1)<.001,(path.name,v.index)
 # Sample first, middle and final keys through Blender's imported skin deformation.
 poses=0;max_extent=0
 for action in actions:
  arm.animation_data_create();arm.animation_data.action=action
  for frame in [action.frame_range[0],sum(action.frame_range)/2,action.frame_range[1]]:
   bpy.context.scene.frame_set(int(frame),subframe=frame-int(frame));deps=bpy.context.evaluated_depsgraph_get()
   for m in meshes:
    evaluated=m.evaluated_get(deps);verts=evaluated.to_mesh()
    for v in verts.vertices:
     p=evaluated.matrix_world@v.co;assert all(math.isfinite(x) for x in p),path.name;max_extent=max(max_extent,p.length)
    evaluated.to_mesh_clear()
   poses+=1
 assert max_extent<5,(path.name,max_extent)
 report[path.stem]={'reimported':True,'bones':len(arm.data.bones),'actions':[a.name for a in actions],'uv':True,'normalizedWeights':True,'sampledPoses':poses,'maxExtent':round(max_extent,3)}
(HERE/'glb-validation.json').write_text(json.dumps(report,indent=2));print('REFERENCE_GLB_VALID',len(report))
