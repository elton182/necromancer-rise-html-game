"""Render all eight directions with Blender's material studio renderer."""
import bpy,sys,os,json,math
from mathutils import Vector
HERE=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE,'boss_soulWarden.blend'))
sc=bpy.context.scene;arm=bpy.data.objects['Rig']
sc.render.engine='BLENDER_WORKBENCH';sc.render.film_transparent=True
sc.render.resolution_x=320;sc.render.resolution_y=320;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.view_settings.view_transform='Standard'
sh=sc.display.shading;sh.light='STUDIO';sh.color_type='MATERIAL';sh.show_shadows=True
sh.show_cavity=True;sh.cavity_type='BOTH';sh.show_object_outline=True;sh.object_outline_color=(.18,.21,.23)
for mat in bpy.data.materials:
 if mat.use_nodes:
  col=mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value
  mat.diffuse_color=col
bpy.ops.object.camera_add();cam=bpy.context.object;sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=320/56
p=math.radians(35);fwd=Vector((0,math.cos(p),-math.sin(p)))
tgt=Vector((0,math.sin(p),math.cos(p)))*(235-160)/56
cam.location=tgt-fwd*12;cam.rotation_euler=(tgt-cam.location).to_track_quat('-Z','Y').to_euler()
out=os.path.join(HERE,'frames_soulWarden');os.makedirs(out,exist_ok=True)
anims=[('idle',4,4,True),('walk',6,10,True),('attack',6,15,False),('windup',6,6/1.2,False),('cast',6,6/1.35,False),('recover',4,5,False),('death',8,10,False)]
meta={'cell':320,'ppu':56,'anchorX':160,'anchorY':235,'dirs':8,'anims':{}}
for ai,(name,n,fps,loop) in enumerate(anims):
 act=bpy.data.actions[name];arm.animation_data.action=act
 if hasattr(act,'slots') and len(act.slots):arm.animation_data.action_slot=act.slots[0]
 meta['anims'][name]={'n':n,'fps':fps,'loop':loop,'row':ai*8}
 for di in range(8):
  arm.rotation_euler=(0,0,math.radians(90-di*45))
  for fi in range(n):
   t=fi/n if loop else fi/(n-1);fr=1+t*(act.frame_range[1]-1)
   sc.frame_set(math.floor(fr),subframe=fr-math.floor(fr))
   sc.render.filepath=os.path.join(out,f'{ai*8+di:02}_{fi:02}.png');bpy.ops.render.render(write_still=True)
 print('FINISHED',name,flush=True)
with open(os.path.join(HERE,'soulWarden_sheet.json'),'w')as f:json.dump(meta,f)
