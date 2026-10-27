"""Build rigged village NPCs matching dialogue paintings; render idle/greeting in 8 directions.
blender -b -t 4 --python blender/village_npcs.py [-- --preview]
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import common as c
PREVIEW='--preview' in sys.argv
IDS={'bram':'smith','lysa':'elder','tilda':'tilda','merchant':'merch'}

def build(ident):
 c.reset_scene();strong=ident=='bram';elder=ident=='lysa';child=ident=='tilda';merchant=ident=='merchant'
 for n,color in {'skin':'#c59676','linen':'#c8b895','cloth':'#59402c' if strong else '#65516e' if elder else '#914331' if child else '#244b3b','leather':'#65442d','hair':'#4c362b' if not elder else '#bbb5ac','hairlight':'#746257' if not elder else '#ddd8ce','eyes':'#352c23','white':'#d5cbbb','metal':'#7b8587','gold':'#b89555','boots':'#3b3028'}.items():c.mat(n,color,metal=.6 if n in ('metal','gold') else 0)
 c.bone('root',(0,0,0),(0,0,.12));c.bone('hips',(0,0,1.03),(0,0,1.2),'root');c.bone('chest',(0,0,1.2),(0,0,1.83),'hips');c.bone('head',(0,0,1.83),(0,0,2.42),'chest')
 width=.43 if strong else .32
 for side,s in [('L',1),('R',-1)]:
  c.bone('arm.'+side,(s*width,0,1.75),(s*(width+.08),0,1.37),'chest');c.bone('hand.'+side,(s*(width+.08),0,1.37),(s*(width+.1),-.1,1.05),'arm.'+side)
  c.bone('leg.'+side,(s*.16,0,1.05),(s*.17,0,.15),'hips')
 c.build_rig()
 c.cone((0,0,1.47),.28,.38 if strong else .29,.68,m='linen' if strong else 'cloth',sc=(1.2 if strong else 1, .7,1),seg=20,smooth=True)
 c.sphere((0,0,1.71),.33,sc=(1.43 if strong else 1.03,.65,.65),m='linen' if strong else 'cloth')
 c.sphere((0,0,1.88),.12,sc=(1,1,1.5),m='skin',bone='head')
 c.sphere((0,-.015,2.14),.27,sc=(.95,.83,1.16),m='skin',bone='head',seg=24)
 c.sphere((0,.035,2.32),.255,sc=(1,.85,.62),m='hair',bone='head',seg=20)
 for i in range(9):
  th=i*math.tau/9;c.sphere((.205*math.cos(th),.02+.15*math.sin(th),2.36+.025*math.sin(i*2)),.075,sc=(1,.85,.7),m='hairlight' if i%4==0 else 'hair',bone='head')
 for side,s in [('L',1),('R',-1)]:
  c.sphere((s*.255,0,2.13),.065,sc=(.6,.7,1.3),m='skin',bone='head')
  c.sphere((s*.092,-.224,2.18),.039,sc=(1,.25,.55),m='white',bone='head')
  c.sphere((s*.092,-.235,2.18),.018,sc=(.65,.3,1),m='eyes',bone='head')
  c.seg((s*.04,-.224,2.24),(s*.15,-.216,2.25),.019,.013,'hair','head',smooth=True)
  c.seg((s*width,0,1.72),(s*(width+.08),0,1.38),.135 if strong else .095,.10 if strong else .08,'linen' if strong or child else 'cloth','arm.'+side,sg=16,smooth=True)
  c.torus((s*(width+.08),0,1.39),.105 if strong else .078,.025,m='linen' if strong or child else 'cloth',bone='arm.'+side)
  c.seg((s*(width+.08),0,1.36),(s*(width+.1),-.08,1.1),.095 if strong else .065,.065 if strong else .05,'skin','hand.'+side,sg=16,smooth=True)
  c.sphere((s*(width+.1),-.075,1.04),.08,sc=(.8,.7,1.1),m='skin',bone='hand.'+side)
  c.seg((s*.16,0,1.06),(s*.17,0,.22),.13,.09,'leather' if strong or merchant else 'cloth','leg.'+side,sg=16,smooth=True)
  c.sphere((s*.17,-.09,.14),.14,sc=(.82,1.5,.72),m='boots',bone='leg.'+side)
 c.sphere((0,-.25,2.105),.06,sc=(.65,1,1.2),m='skin',bone='head')
 c.seg((-.065,-.225,2.015),(.065,-.225,2.015),.012,.012,'leather','head',smooth=True)
 if strong or merchant:
  c.sphere((0,-.13,1.99),.20 if strong else .17,sc=(1,.66,.9 if strong else .5),m='hair',bone='head',seg=20)
  for s in [-1,1]:c.sphere((s*.065,-.224,2.06),.065,sc=(1.1,.35,.4),m='hairlight',bone='head')
  if strong:
   for s in [-1,1]:c.seg((s*.13,-.208,2.01),(s*.08,-.23,1.92),.012,.008,'hairlight','head',smooth=True)
 if strong:
  c.box((0,-.214,1.21),(.53,.055,.75),m='leather')
  for s in [-1,1]:
   c.seg((s*.25,-.08,1.83),(s*.19,-.245,1.54),.031,.031,'leather','chest',smooth=True)
   for z in [1.52,.9]:c.sphere((s*.22,-.25,z),.022,m='gold')
  c.box((0,-.25,1.19),(.25,.028,.17),m='cloth')
  c.seg((-.54,-.1,1.09),(-.54,-.1,.68),.035,.035,'leather','hand.R',smooth=True)
  c.box((-.54,-.1,.67),(.26,.12,.13),m='metal',bone='hand.R')
 elif elder or child:
  c.cone((0,0,.72),.43 if elder else .36,.24,.97,m='cloth',bone='hips',seg=24,smooth=True,sc=(1,.76,1))
  for s in [-1,1]:
   c.sphere((s*.225,.055,2.14),.09,sc=(.7,1,2.1),m='hair',bone='head')
   if child:
    for z in [2.0,1.9,1.8]:c.sphere((s*.235,.04,z),.06,sc=(.8,.8,1.1),m='hair',bone='head')
  if elder:
   c.sphere((0,.07,2.37),.125,m='hairlight',bone='head')
   c.sphere((0,-.025,1.74),.3,sc=(1.25,1,.35),m='cloth')
   c.sphere((0,-.28,1.72),.045,m='gold')
   c.seg((.45,-.08,.12),(.45,-.08,1.89),.031,.028,'leather','hand.L',smooth=True)
   c.sphere((.45,-.08,1.9),.06,m='leather',bone='hand.L')
  else:
   c.sphere((0,-.205,1.78),.14,sc=(1,.25,.4),m='linen')
 else:
  c.cone((0,0,1.05),.34,.29,.52,m='cloth',seg=20,smooth=True,sc=(1,.72,1))
  for s in [-1,1]:c.seg((s*.22,-.16,1.8),(s*.055,-.255,1.33),.025,.025,'leather','chest',smooth=True)
  c.sphere((0,-.27,1.33),.055,sc=(1,.25,1),m='gold')
  c.box((-.4,-.16,1.15),(.19,.11,.26),m='leather',bone='hand.R')
 c.torus((0,0,1.1),.27,.035,m='leather',bone='hips',sc=(1,.73,1))
 c.box((0,-.22,1.1),(.09,.04,.065),m='gold',bone='hips')
 c.finish('NPC_'+ident)
 sc=bpy.context.scene;c.init_anim(sc)
 def idle(t):
  c.R('chest',x=.018*math.sin(t*math.tau));c.R('head',z=.022*math.sin(t*math.tau));c.PB['chest'].location.y=.007*math.sin(t*math.tau)
 def greet(t):
  idle(t);v=math.sin(math.pi*t)**2
  c.R('arm.L',x=-.15*v,y=-.8*v,z=.13*v);c.R('hand.L',x=-.45*v,y=.18*math.sin(t*math.tau*2)*v);c.R('head',x=.07*math.sin(t*math.tau))
 c.bake_loop('idle',8,idle);c.bake_loop('greet',8,greet)
 sc.frame_end=9;c.ARM.animation_data.action=bpy.data.actions['idle'];sc.frame_set(1)
 # The game applies the existing NPC-specific height scale.
 bpy.ops.object.select_all(action='DESELECT');c.ARM.select_set(True);bpy.data.objects['NPC_'+ident].select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(HERE/('villager_'+ident+'.glb')),export_format='GLB',use_selection=True,export_animation_mode='ACTIONS')
 return sc,c.ARM

def render(ident):
 sc,arm=build(ident)
 for mat in bpy.data.materials:
  if mat.use_nodes:mat.diffuse_color=mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value
 sc.render.engine='BLENDER_WORKBENCH';sc.render.film_transparent=True
 sc.display.shading.light='STUDIO';sc.display.shading.studiolight_rotate_z=.35;sc.display.shading.color_type='MATERIAL';sc.display.shading.show_shadows=True;sc.display.shading.show_cavity=True;sc.display.shading.cavity_type='BOTH';sc.display.shading.curvature_ridge_factor=1.25;sc.display.shading.curvature_valley_factor=.8
 sc.display.shading.show_specular_highlight=False;sc.display.shading.show_object_outline=True;sc.display.shading.object_outline_color=(.12,.1,.08)
 sc.view_settings.view_transform='Standard';sc.render.resolution_x=224;sc.render.resolution_y=224;sc.render.resolution_percentage=100
 sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
 bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4;sc.camera=cam
 pitch=math.radians(35);fwd=Vector((0,math.cos(pitch),-math.sin(pitch)));target=Vector((0,math.sin(pitch),math.cos(pitch)))*(165-112)/56
 cam.location=target-fwd*12;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 arm.rotation_euler.z=0;sc.frame_set(1)
 bpy.ops.wm.save_as_mainfile(filepath=str(HERE/('villager_'+ident+'.blend')))
 folder=HERE/('frames_villager_'+ident);folder.mkdir(exist_ok=True)
 meta={'cell':224,'ppu':56,'anchorX':112,'anchorY':165,'dirs':8,'anims':{'idle':{'n':8,'fps':5,'loop':True,'row':0},'attack':{'n':8,'fps':6,'loop':True,'row':8}}}
 for ai,name in enumerate(['idle','greet']):
  arm.animation_data.action=bpy.data.actions[name]
  for di in range(8):
   arm.rotation_euler.z=math.radians(90-di*45)
   for fi in range(8):
    if PREVIEW and (ai!=0 or di!=2 or fi!=0):continue
    sc.frame_set(fi+1);sc.render.filepath=str(folder/f'{ai*8+di:02}_{fi:02}.png');bpy.ops.render.render(write_still=True)
 (HERE/('villager_'+ident+'_sheet.json')).write_text(json.dumps(meta,separators=(',',':')))
for ident in IDS:render(ident)
