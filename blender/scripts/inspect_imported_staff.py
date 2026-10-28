from pathlib import Path
import bpy,json
import bmesh
from mathutils import Vector
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(BASE/'exports/necromancer_1.glb'))
o=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.visible_get())
bpy.context.view_layer.objects.active=o;o.select_set(True)
bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001);bm.to_mesh(o.data);bm.free()
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='LOOSE');bpy.ops.object.mode_set(mode='OBJECT')
report=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 vs=[o.matrix_world@v.co for v in o.data.vertices]
 if max(v.x for v in vs)<.15 or max(v.z for v in vs)<.85:continue
 report.append(dict(name=o.name,n=len(vs),lo=[min(v[i] for v in vs) for i in range(3)],hi=[max(v[i] for v in vs) for i in range(3)]))
print(json.dumps(report))
