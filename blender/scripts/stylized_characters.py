"""Five chunky, matte low-poly characters, matching the in-game reference.
blender -b -t 4 --python blender/scripts/stylized_characters.py [-- --preview]
"""
import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;BLENDER=HERE.parent;sys.path.insert(0,str(HERE))
import common as c
import character_sculpt as sculptor
PREVIEW='--preview' in sys.argv
CHARACTERS={'bram':'smith','lysa':'elder','tilda':'tilda','merchant':'merch','zephyr':'necro'}

def build(ident):
 c.reset_scene();strong=ident=='bram';elder=ident=='lysa';child=ident=='tilda';hero=ident=='zephyr';merchant=ident=='merchant'
 palette={'skin':'#d4b582','skinshade':'#b48c5c','linen':'#ddd3a1','cuff':'#a69d76','cloth':'#63502b' if strong else '#756784' if elder else '#974b36' if child else '#315b40','leather':'#5c492b','hair':'#49402b' if not elder else '#aaa89a','hairlight':'#5d5338' if not elder else '#cac5b3','eyes':'#302d20','metal':'#666d66','metallight':'#8b9386','wood':'#49412f','gold':'#a68c46','boots':'#3b3220','robe':'#5a08c4','robeshade':'#3e0688','robebright':'#6a10d1','face':'#160c2c','orb':'#e1e3c8'}
 for name,color in palette.items():c.mat(name,color)
 # One rig convention is shared by all five actors; original game actions are preserved.
 shoulder=.52 if strong else .40 if not hero else .34
 c.bone('root',(0,0,0),(0,0,.12));c.bone('hips',(0,0,1),(0,0,1.16),'root');c.bone('chest',(0,0,1.16),(0,0,1.75),'hips');c.bone('head',(0,0,1.75),(0,0,2.34),'chest')
 for side,s in [('L',1),('R',-1)]:
  c.bone('arm.'+side,(s*shoulder,0,1.65),(s*(shoulder+.12),-.025,1.34),'chest')
  c.bone('forearm.'+side,(s*(shoulder+.12),-.025,1.34),(s*(shoulder+.1),-.16,1.06),'arm.'+side)
  c.bone('hand.'+side,(s*(shoulder+.1),-.16,1.06),(s*(shoulder+.1),-.17,.95),'forearm.'+side)
  c.bone('leg.'+side,(s*.20,0,.99),(s*.20,0,.2),'hips')
 if hero:
  c.bone('staff',(-.48,-.18,.98),(-.48,-.18,2.2),'hand.R');c.bone('cape',(0,.18,1.67),(0,.26,.22),'chest')
 c.build_rig()
 sculptor.sculpt(ident,shoulder)
 body=c.finish('Zephyr_stylized' if hero else 'NPC_'+ident+'_stylized')
 for poly in body.data.polygons:poly.use_smooth=False
 sc=bpy.context.scene;c.init_anim(sc)
 def idle(t):
  p=math.tau*t;c.R('chest',x=.02*math.sin(p));c.R('head',z=.025*math.sin(p));c.PB['hips'].location.z=.012*math.sin(p)
  if hero:c.R('cape',x=.035*math.sin(p+.8))
 def greet(t):
  idle(t);v=math.sin(math.pi*t)**2;c.R('arm.L',x=-.35*v,y=-.65*v);c.R('forearm.L',x=-.6*v,z=.13*math.sin(t*math.tau*2)*v);c.R('head',x=.06*math.sin(t*math.tau))
 def walk(t):
  p=math.tau*t;c.PB['hips'].location.z=.025*abs(math.sin(p));c.R('chest',x=-.035,z=.05*math.sin(p));c.R('head',z=-.04*math.sin(p))
  for side,phase in [('L',0),('R',math.pi)]:c.R('leg.'+side,x=.32*math.sin(p+phase))
  c.R('arm.L',x=-.4*math.sin(p));c.R('forearm.L',x=-.18);c.R('arm.R',x=.10*math.sin(p));c.R('cape',x=.1+.07*math.sin(p+.5))
 def cast(t):
  v=math.sin(math.pi*t)**2;c.R('arm.L',x=-1.25*v,y=-.15*v);c.R('forearm.L',x=-.3*v);c.R('chest',x=-.12*v);c.R('head',x=-.08*v);c.R('arm.R',x=-.25*v);c.R('staff',x=-.12*v);c.R('cape',x=.2*v)
 def death(t):
  v=min(1,t/.8);v=v*v*(3-2*v);c.R('root',x=1.42*v);c.PB['root'].location.z=.025*v;c.R('chest',x=-.1*v);c.R('arm.L',z=-.3*v);c.R('arm.R',z=.22*v);c.R('head',x=.15*v)
 c.bake_loop('idle',8,idle)
 if hero:c.bake_loop('walk',10,walk);c.bake_once('cast',8,cast);c.bake_once('death',10,death)
 else:c.bake_loop('greet',8,greet)
 c.ARM.animation_data.action=bpy.data.actions['idle'];sc.frame_set(1);sc.frame_end=11 if hero else 9
 return sc,c.ARM,body

def render(ident):
 sc,arm,body=build(ident);hero=ident=='zephyr'
 for material in bpy.data.materials:
  if material.use_nodes:material.diffuse_color=material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value
 sc.render.engine='CYCLES';sc.cycles.samples=4;sc.cycles.use_denoising=False;sc.render.use_freestyle=False;sc.render.film_transparent=True;sc.view_settings.view_transform='Standard'
 shading=sc.display.shading;shading.light='STUDIO';shading.studiolight_rotate_z=.4;shading.color_type='MATERIAL';shading.show_shadows=True;shading.show_cavity=False;shading.show_specular_highlight=False;shading.show_object_outline=False
 arm.rotation_euler.z=math.radians(45) if not hero else 0;sc.frame_set(1)
 bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);body.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(BLENDER/'exports'/('stylized_'+ident+'.glb')),export_format='GLB',use_selection=True,export_animation_mode='ACTIONS')
 import toon
 toon.toonify(sc,light=(-.5,-.65,.9),bands=(.64,.83,1.0),thick=1,line=(.12,.12,.08));sc.render.use_freestyle=False
 cell=320 if hero else 256;anchor=207 if hero else 184;ppu=56
 sc.render.resolution_x=sc.render.resolution_y=cell;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
 bpy.ops.object.camera_add();cam=bpy.context.object;sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=cell/ppu
 pitch=math.radians(32);forward=Vector((0,math.cos(pitch),-math.sin(pitch)));target=Vector((0,math.sin(pitch),math.cos(pitch)))*(anchor-cell/2)/ppu
 cam.location=target-forward*12;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 arm.rotation_euler.z=math.radians(45) if not hero else 0;sc.frame_set(1)
 bpy.ops.wm.save_as_mainfile(filepath=str(BLENDER/'models'/('stylized_'+ident+'.blend')))
 folder=BLENDER/'frames'/('frames_stylized_'+ident);folder.mkdir(parents=True,exist_ok=True)
 anims=[('idle','idle',8,5,True),('walk','walk',10,12,True),('cast','cast',8,16,False),('death','death',10,12,False)] if hero else [('idle','idle',8,5,True),('greet','attack',8,6,True)]
 meta={'cell':cell,'ppu':ppu,'anchorX':cell//2,'anchorY':anchor,'dirs':8,'anims':{}}
 for ai,(action,label,n,fps,loop) in enumerate(anims):
  arm.animation_data.action=bpy.data.actions[action];meta['anims'][label]={'n':n,'fps':fps,'loop':loop,'row':ai*8}
  for di in range(8):
   arm.rotation_euler.z=math.radians(90-di*45)
   for fi in range(n):
    if PREVIEW and not((ai==0 and di in [1,2,3] and fi==0)or(hero and action=='death' and fi==n-1)):continue
    sc.frame_set(fi+1);sc.render.filepath=str(folder/f'{ai*8+di:02}_{fi:02}.png');bpy.ops.render.render(write_still=True)
 (folder/'render.json').write_text(json.dumps(meta,separators=(',',':')))
if __name__=='__main__':
 for ident in CHARACTERS:
  if any(a.startswith('--only=') for a in sys.argv) and '--only='+ident not in sys.argv:continue
  render(ident)
