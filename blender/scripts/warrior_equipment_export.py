"""Exporta escudo e máscara visual usando cópias; preserva a cena ativa do usuário.

Com a cena aberta no Blender, a biblioteca não pode ler o próprio arquivo: nesse caso, execute fora da sessão, na raiz:
  blender --background --factory-startup --python blender/scripts/warrior_equipment_export.py
"""
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
window=bpy.context.window;original_scene=window.scene if window else None;old_active=bpy.context.view_layer.objects.active;old_selected=list(bpy.context.selected_objects)
with bpy.data.libraries.load(str(ROOT/'models/warrior.blend'),link=False) as (available,loaded):
 loaded.objects=['WarriorOrigin','WarriorRig','WarriorBody']
imported=[o for o in loaded.objects if o]
source=next(o for o in imported if o.type=='MESH');source_rig=next(o for o in imported if o.type=='ARMATURE');source_root=source_rig.parent
mesh=source.data
parents=list(range(len(mesh.vertices)))
def find(i):
 while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
 return i
for edge in mesh.edges:
 a,b=map(find,edge.vertices);parents[a]=b
parts={}
for v in mesh.vertices:parts.setdefault(find(v.index),[]).append(v)
group=source.vertex_groups['mixamorig:LeftHand'].index
ids=set()
for vertices in parts.values():
 if max(v.co.z for v in vertices)-min(v.co.z for v in vertices)>.08 and all(any(g.group==group and g.weight>.999 for g in v.groups) for v in vertices):ids.update(v.index for v in vertices)
assert 30<len(ids)<200,len(ids)
# Sem janela não há como trocar a cena ativa; a execução em segundo plano usa a cena vazia de partida.
scene=bpy.data.scenes.new('COL_WarriorExportTemporary') if window else bpy.context.scene;scene.render.fps=30
objects=[]
try:
 root=source_root.copy();scene.collection.objects.link(root);objects.append(root)
 rig=source_rig.copy();rig.data=source_rig.data.copy();rig.parent=root;scene.collection.objects.link(rig);objects.append(rig)
 body=source.copy();body.data=mesh.copy();body.parent=rig;scene.collection.objects.link(body);objects.append(body)
 for mod in body.modifiers:
  if mod.type=='ARMATURE':mod.object=rig
 attr=body.data.attributes.get('_warrior_shield') or body.data.attributes.new('_warrior_shield','FLOAT','POINT')
 attr.data.foreach_set('value',[1.0 if i in ids else 0.0 for i in range(len(mesh.vertices))])
 if body.animation_data:body.animation_data.action=None
 rig.animation_data.action=None
 # O tornado segue só na cena, para edição, até ser integrado ao jogo.
 expected={'idle','walk','strafe_left','strafe_right','slash_1','slash_2','slash_3','thrust','shield_bash','death','dodge'}
 for track in list(rig.animation_data.nla_tracks):
  if track.name not in expected:rig.animation_data.nla_tracks.remove(track);continue
  strip=track.strips[0];lo,hi=strip.action.frame_range;strip.action_frame_start=lo;strip.action_frame_end=hi;strip.frame_start=1;strip.scale=1;strip.repeat=1;strip.frame_end=1+hi-lo;track.mute=False
 for b in rig.pose.bones:b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
 if window:window.scene=scene
 else:bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/warrior.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_attributes=True)
 # Escudo isolado, com os mesmos materiais e UVs do personagem.
 selected=sorted(ids);mapping={old:new for new,old in enumerate(selected)}
 polygons=[p for p in mesh.polygons if all(v in ids for v in p.vertices)]
 points=[mesh.vertices[i].co.copy() for i in selected];center=Vector(tuple((min(p[i] for p in points)+max(p[i] for p in points))/2 for i in range(3)));bottom=min(p.z for p in points)
 data=bpy.data.meshes.new('WarriorShieldMesh');data.from_pydata([(p.x-center.x,p.y-center.y,p.z-bottom) for p in points],[],[[mapping[i] for i in p.vertices] for p in polygons]);data.update()
 for m in mesh.materials:data.materials.append(m)
 if mesh.uv_layers.active:
  uv=data.uv_layers.new(name='UVMap')
  for old,new in zip(polygons,data.polygons):
   for oi,ni in zip(old.loop_indices,new.loop_indices):uv.data[ni].uv=mesh.uv_layers.active.data[oi].uv
 shield=bpy.data.objects.new('WarriorShield',data);scene.collection.objects.link(shield);objects.append(shield)
 bpy.ops.object.select_all(action='DESELECT');shield.select_set(True);bpy.context.view_layer.objects.active=shield
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/warrior_shield.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=False)
 print('Escudo:',len(ids),'vértices;',len(data.polygons),'faces. Clipes do personagem preservados.')
finally:
 if window:window.scene=original_scene
 for o in objects:
  data=o.data if o.type in ['MESH','ARMATURE'] else None
  bpy.data.objects.remove(o,do_unlink=True)
  if data and data.users==0:
   if isinstance(data,bpy.types.Mesh):bpy.data.meshes.remove(data)
   else:bpy.data.armatures.remove(data)
 if window:bpy.data.scenes.remove(scene)
 for o in imported:
  bpy.data.objects.remove(o,do_unlink=True)
 for o in old_selected:
  if o.name in bpy.context.view_layer.objects:o.select_set(True)
 if old_active and old_active.name in bpy.context.view_layer.objects:bpy.context.view_layer.objects.active=old_active
