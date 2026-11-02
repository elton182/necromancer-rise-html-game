"""Cavalo de tração low-poly com rig e clipes idle/walk da viagem inicial."""
import bpy, sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v2_village_kit as kit
BASE=Path(__file__).resolve().parents[1];kit.clear()
kit.PALETTE.update({'coat':('#99653f',.85,None),'mane':('#362922',.9,None),'muzzle':('#c19b72',.9,None)})
p=kit.Piece('horse_body')
p.box('coat',(-.4,-.85,1),(.4,.8,1.7))
p.prism('coat',[(-.32,1.4),(.32,1.4),(.22,2.15),(-.22,2.15)],-.95,-.55)
p.box('coat',(-.25,-1.4,1.85),(.25,-.7,2.25))
p.box('muzzle',(-.22,-1.65,1.78),(.22,-1.3,2.05))
for x in [-.18,.13]:p.box('coat',(x,-.91,2.23),(x+.08,-.78,2.55))
for x in [-.26,.245]:p.box('iron',(x,-1.21,2.1),(x+.015,-1.13,2.16))
p.box('mane',(-.11,-.6,1.55),(.11,-.46,2.26))
p.box('mane',(-.12,.76,.7),(.12,1.08,1.5))
# Peitoral e tirantes: seguem até os varais, na direção oposta à cabeça.
p.box('iron',(-.43,-.58,1.19),(.43,-.47,1.36))
for x in [-.45,.42]:p.box('rope',(x,-.5,.92),(x+.035,1.5,.98))
meshes=[(p.finish(bevel=.035),'root')]
for i,(x,y) in enumerate([(-.29,-.58),(.29,-.58),(-.29,.56),(.29,.56)]):
 p=kit.Piece('horse_leg_'+str(i));p.box('coat',(x-.095,y-.1,.14),(x+.095,y+.1,1.14));p.box('iron',(x-.12,y-.15,.02),(x+.12,y+.14,.21));meshes.append((p.finish(bevel=.015),'leg_'+str(i)))
armdata=bpy.data.armatures.new('CaravanHorseRig');arm=bpy.data.objects.new('CaravanHorseRig',armdata);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');root=armdata.edit_bones.new('root');root.head=(0,0,0);root.tail=(0,0,.3)
for i,(x,y) in enumerate([(-.29,-.58),(.29,-.58),(-.29,.56),(.29,.56)]):
 b=armdata.edit_bones.new('leg_'+str(i));b.head=(x,y,1.14);b.tail=(x,y,.15);b.parent=root
bpy.ops.object.mode_set(mode='OBJECT')
for obj,bone in meshes:
 obj.parent=arm;group=obj.vertex_groups.new(name=bone);group.add(list(range(len(obj.data.vertices))),1,'REPLACE');mod=obj.modifiers.new('Horse rig','ARMATURE');mod.object=arm
arm.animation_data_create();scene=bpy.context.scene;scene.render.fps=24
for name in ['idle','walk']:
 action=bpy.data.actions.new(name);arm.animation_data.action=action
 for frame in range(1,26):
  phase=(frame-1)/24*math.tau
  for i in range(4):
   b=arm.pose.bones['leg_'+str(i)];b.rotation_mode='XYZ';b.rotation_euler=(math.sin(phase+(0 if i in [0,3] else math.pi))*(.3 if name=='walk' else .015),0,0);b.keyframe_insert('rotation_euler',frame=frame)
  b=arm.pose.bones['root'];b.location.z=math.sin(phase*2)*(.025 if name=='walk' else .008);b.keyframe_insert('location',frame=frame)
 action.use_fake_user=True;track=arm.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action)
arm.animation_data.action=None;scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True)
for obj,_ in meshes:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(BASE/'exports'/'arandu_caravan_horse.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_frame_range=False,export_force_sampling=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models'/'arandu_caravan_horse.blend'),copy=True)
