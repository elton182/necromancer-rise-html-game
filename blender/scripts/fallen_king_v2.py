"""Variante com espada rígida presa à mão, preservando o primeiro estudo."""
from pathlib import Path
import bpy
from mathutils import Vector, Matrix
BASE=Path(__file__).resolve().parents[1]
source=(BASE/'scripts/fallen_king.py').read_text(encoding='utf-8')
source=source.replace('fallen_king_source.glb','fallen_king_model_v2.glb').replace('boss_fallenKing.blend','boss_fallenKing_v2.blend').replace('fallen_king_validation.json','fallen_king_v2_validation.json')
exec(compile(source,str(BASE/'scripts/fallen_king.py'),'exec'))
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(BASE/'exports/fallen_king_sword_v2.glb'))
swords=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH']
hand=rig.data.bones['mixamorig:RightHand']
for sword in swords:
    # Bake import transform; long axis becomes the rigid blade axis.
    sword.data.transform(sword.matrix_world);sword.matrix_world=Matrix.Identity(4)
    verts=[v.co.copy() for v in sword.data.vertices]
    low=Vector(tuple(min(v[i] for v in verts) for i in range(3)))
    high=Vector(tuple(max(v[i] for v in verts) for i in range(3)))
    axis=max(range(3),key=lambda i:high[i]-low[i])
    direction=Vector(tuple(1 if i==axis else 0 for i in range(3)))
    rotation=direction.rotation_difference(Vector((0,1,0))).to_matrix().to_4x4()
    sword.data.transform(rotation)
    low=Vector(tuple(min(v.co[i] for v in sword.data.vertices) for i in range(3)))
    high=Vector(tuple(max(v.co[i] for v in sword.data.vertices) for i in range(3)))
    grip=Vector(((low.x+high.x)/2,low.y+(high.y-low.y)*.20,(low.z+high.z)/2))
    height=max(o.dimensions.z for o in before if o.type=='MESH')
    scale=height*.65/(high.y-low.y)
    sword.data.transform(Matrix.Scale(scale,4)@Matrix.Translation(-grip))
    sword.parent=rig;sword.parent_type='BONE';sword.parent_bone=hand.name
    sword.matrix_parent_inverse=Matrix.Identity(4)
    sword.location=(0,-hand.length*.45,0);sword.rotation_euler=(0,0,0);sword.scale=(1,1,1)
    sword.name='Espada Rei Caído — rígida'
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/boss_fallenKing_v2.blend'))
