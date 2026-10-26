"""Render eight directions with the shared three-band cel shader."""
import bpy,sys,os,json,math
from mathutils import Vector
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _folder in ('models', 'exports', 'frames', 'spritesheets', 'previews'):
    os.makedirs(os.path.join(HERE, _folder), exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'models', 'mob_cryptHound.blend'))
sc=bpy.context.scene;arm=bpy.data.objects['Rig']
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import combat_toon
combat_toon.setup(sc)
preview='preview' in sys.argv
sc.render.resolution_x=224;sc.render.resolution_y=224;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.view_settings.view_transform='Standard'
bpy.ops.object.camera_add();cam=bpy.context.object;sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=4
p=math.radians(35);fwd=Vector((0,math.cos(p),-math.sin(p)))
tgt=Vector((0,math.sin(p),math.cos(p)))*(165-112)/56
cam.location=tgt-fwd*12;cam.rotation_euler=(tgt-cam.location).to_track_quat('-Z','Y').to_euler()
out=os.path.join(HERE, 'frames', 'frames_cryptHound');os.makedirs(out,exist_ok=True)
anims=[('idle',4,4,True),('walk',6,12,True),('attack',6,20,False),('windup',4,4/.75,False),('charge',4,12,True),('recover',4,4,False),('death',6,7.5,False)]
meta={'cell':224,'ppu':56,'anchorX':112,'anchorY':165,'dirs':8,'anims':{}}
for ai,(name,n,fps,loop) in enumerate(anims):
 act=bpy.data.actions[name];arm.animation_data.action=act
 if hasattr(act,'slots') and len(act.slots):arm.animation_data.action_slot=act.slots[0]
 meta['anims'][name]={'n':n,'fps':fps,'loop':loop,'row':ai*8}
 for di in range(8):
  arm.rotation_euler=(0,0,math.radians(90-di*45))
  for fi in range(n):
   if preview and (di not in (1,2,3) or fi not in (0,n-1) or name not in ('idle','windup','attack','death')):continue
   t=fi/n if loop else fi/(n-1);fr=1+t*(act.frame_range[1]-1)
   sc.frame_set(math.floor(fr),subframe=fr-math.floor(fr))
   sc.render.filepath=os.path.join(out,f'{ai*8+di:02}_{fi:02}.png');bpy.ops.render.render(write_still=True)
 print('FINISHED',name,flush=True)
if not preview:
 with open(os.path.join(HERE, 'spritesheets', 'cryptHound_sheet.json'),'w')as f:json.dump(meta,f)
