"""Create editable dialogue-only busts and transparent portraits. Run with Blender or bpy."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets'/'npc-portraits'
OUT.mkdir(parents=True,exist_ok=True)

def material(name,color,metal=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=.65
 return m

def shape(name,loc,scale,mat,cube=False):
 if cube: bpy.ops.mesh.primitive_cube_add(size=2,location=loc)
 else: bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=loc)
 o=bpy.context.object; o.name=name; o.scale=scale; o.data.materials.append(mat)
 if not cube:
  for p in o.data.polygons:p.use_smooth=True
 else:
  mod=o.modifiers.new('Soft edges','BEVEL'); mod.width=.08; mod.segments=3; o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o

def bar(name,a,b,r,mat):
 a,b=Vector(a),Vector(b); o=shape(name,(a+b)/2,(r,r,(b-a).length/2),mat); o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return o

for ident in ['bram','lysa','tilda','merchant']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 skin=material('Skin',(.57,.31,.18) if ident=='bram' else (.72,.48,.33))
 cloth=material('Profession clothing',{'bram':(.16,.075,.032),'lysa':(.21,.13,.32),'tilda':(.43,.075,.045),'merchant':(.065,.23,.19)}[ident])
 hair=material('Hair',{'bram':(.12,.055,.023),'lysa':(.62,.62,.66),'tilda':(.25,.085,.025),'merchant':(.10,.07,.045)}[ident])
 gold=material('Brass',(.65,.39,.09),.7); white=material('Eyes',(.9,.85,.72)); black=material('Pupils',(.025,.022,.018)); leather=material('Leather straps',(.24,.12,.045))
 strong=ident=='bram'; child=ident=='tilda'
 shape('Torso',(0,0,.75),(.85 if strong else .66,.36,.85),cloth)
 for side in [-1,1]:
  shape('Shoulder',(side*(.86 if strong else .59),0,1.15),(.34 if strong else .23,.32,.36),skin if strong else cloth)
  bar('Arm',(side*(.9 if strong else .63),0,1.1),(side*(1 if strong else .7),-.04,.35),.24 if strong else .16,skin if strong else cloth)
 shape('Neck',(0,0,1.53),(.23,.23,.32),skin)
 shape('Head',(0,-.015,2.03),(.42 if not child else .44,.34,.53),skin)
 shape('Hair cap',(0,.055,2.35),(.43,.32,.25),hair)
 for side in [-1,1]:
  shape('Ear',(side*.415,-.015,2.02),(.085,.09,.14),skin)
  shape('Eye',(side*.16,-.323,2.11),(.095,.036,.052),white)
  shape('Iris',(side*.16,-.356,2.11),(.036,.018,.04),black)
  brow=shape('Brow',(side*.16,-.337,2.22),(.115,.038,.028),hair); brow.rotation_euler.y=side*.12
 shape('Nose',(0,-.365,2),(.09,.12,.13),skin)
 shape('Mouth',(0,-.336,1.84),(.115,.025,.022),leather)
 if strong or ident=='merchant':
  shape('Beard',(0,-.20,1.72),(.32,.23,.23 if strong else .14),hair)
  shape('Moustache',(0,-.355,1.9),(.19,.055,.048),hair)
 if strong:
  shape('Leather apron',(0,-.335,.67),(.59,.06,.69),leather,True)
  for s in [-1,1]: bar('Apron strap',(s*.42,-.29,1.45),(s*.3,-.41,1),.047,leather)
  steel=material('Hammer steel',(.24,.28,.31),.8)
  bar('Hammer handle',(.72,-.4,.43),(.72,-.4,1.55),.065,leather)
  shape('Hammer head',(.72,-.4,1.55),(.27,.15,.15),steel,True)
 elif ident=='lysa':
  for s in [-1,1]:shape('Silver side hair',(s*.36,.06,2.04),(.12,.27,.45),hair)
  bar('Walking staff',(.77,-.22,.05),(.77,-.22,2.35),.055,leather)
  shape('Staff amethyst',(.77,-.22,2.4),(.13,.13,.18),cloth)
  shape('Shawl',(0,-.23,1.22),(.67,.18,.24),cloth)
 elif child:
  for s in [-1,1]:shape('Braided hair',(s*.36,.05,1.78),(.11,.16,.4),hair)
  shape('Linen collar',(0,-.32,1.35),(.3,.075,.1),white)
 else:
  shape('Merchant cap',(0,.03,2.55),(.48,.37,.17),cloth)
  bar('Gold chain',(-.32,-.32,1.45),(0,-.43,1.05),.025,gold);bar('Gold chain',(0,-.43,1.05),(.32,-.32,1.45),.025,gold)
  shape('Medallion',(0,-.44,1.05),(.09,.04,.11),gold)
  shape('Ledger',(.65,-.3,.65),(.21,.12,.33),leather,True)
 scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=24
 scene.render.resolution_x=480; scene.render.resolution_y=560; scene.render.resolution_percentage=100; scene.render.film_transparent=True
 scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.13,.2,1)
 for name,loc,power,size in [('Key',(-3,-4,6),650,4),('Fill',(4,-2,3),350,3),('Rim',(1,3,4),850,3)]:
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(3*-0.22,-7,2.8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=3.15;scene.camera=cam
 scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/(ident+'.png'))
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender'/'models'/('npc_'+ident+'.blend')))
 bpy.ops.render.render(write_still=True)
