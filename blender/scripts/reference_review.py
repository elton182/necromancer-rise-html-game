"""Render an inspectable scene containing the eight real exported models."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parents[1]/'reference';ROOT=HERE.parent.parent
bpy.ops.wm.read_factory_settings(use_empty=True)
ids=['bram','zephyr','skeleton','archer','skeleton_mage','raider','corrupted','shadow_wolf']
for i,ident in enumerate(ids):
 before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(HERE/(ident+'.glb')));new=set(bpy.context.scene.objects)-before
 # Global translations preserve imported GLB's inverse-bind matrices.
 root=bpy.data.objects.new(ident+'_display',None);bpy.context.collection.objects.link(root)
 for o in new:
  if o.parent is None:o.parent=root
 root.location=((i%4)*2.45-3.65,(i//4)*3.65,0);root.rotation_euler.z=math.radians(-18)
 for rig in [o for o in new if o.type=='ARMATURE']:
  if rig.animation_data:rig.animation_data.action=None
 bpy.ops.object.text_add(location=(root.location.x,root.location.y-.72,.008),rotation=(0,0,0));label=bpy.context.object;label.data.body={'bram':'BRAM - FERREIRO','zephyr':'ZEPHYR','skeleton':'ESQUELETO GUERREIRO','archer':'ESQUELETO ARQUEIRO','skeleton_mage':'ESQUELETO MAGO','raider':'SAQUEADOR','corrupted':'GUERREIRO CORROMPIDO','shadow_wolf':'LOBO SOMBRIO'}[ident];label.data.size=.17;label.data.align_x='CENTER';label.data.extrude=.001
sc=bpy.context.scene;sc.frame_set(1);sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True;sc.view_settings.view_transform='Standard'
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.name='Neutral studio floor';mat=bpy.data.materials.new('Warm gray floor');mat.diffuse_color=(.30,.28,.24,1);floor.data.materials.append(mat)
world=bpy.data.worlds.new('Studio');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.55,.55,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6;sc.world=world
for location,energy,size in [((-4,-5,9),1800,7),((5,5,7),1200,6)]:
 bpy.ops.object.light_add(type='AREA',location=location);light=bpy.context.object;light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,1,1))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(7,-14,13));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=12.8;cam.rotation_euler=(Vector((0,1.7,.8))-cam.location).to_track_quat('-Z','Y').to_euler();sc.camera=cam
sc.render.resolution_x=1600;sc.render.resolution_y=1150;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.render.filepath=str(ROOT/'review/reference-cast-models.png')
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'cast-review.blend'));bpy.ops.render.render(write_still=True)
