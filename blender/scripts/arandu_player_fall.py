"""Adiciona um clipe próprio de queda em cópia do player atual, sem alterá-lo.
Blender --background blender/models/v2_player.blend --python blender/scripts/arandu_player_fall.py
"""
import bpy,math
from pathlib import Path
from mathutils import Quaternion,Vector
BASE=Path(__file__).resolve().parents[1];sc=bpy.context.scene
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE')
idle=next((a for a in bpy.data.actions if a.name=='idle'),None)
arm.animation_data_create()
for track in arm.animation_data.nla_tracks:track.mute=True
if idle:arm.animation_data.action=idle
sc.frame_set(1);bpy.context.view_layer.update()
base={b.name:(b.rotation_quaternion.copy(),b.location.copy()) for b in arm.pose.bones}
action=bpy.data.actions.new('fall');arm.animation_data.action=action
sc.render.fps=24
def rotate(name,axis,angle):
 b=arm.pose.bones.get('mixamorig:'+name)
 if b:
  local=b.bone.matrix_local.to_3x3().inverted()@Vector(axis)
  b.rotation_quaternion=Quaternion(local.normalized(),angle)@b.rotation_quaternion
for f in range(1,38):
 t=(f-1)/36;spread=min(1,t*4);wave=math.sin(t*math.tau*2)
 for b in arm.pose.bones:
  b.rotation_mode='QUATERNION';b.rotation_quaternion=base[b.name][0];b.location=base[b.name][1]
 rotate('LeftArm',(0,1,0),-spread*(.8+.16*wave));rotate('RightArm',(0,1,0),spread*(.65-.12*wave))
 rotate('LeftForeArm',(1,0,0),-.25*spread);rotate('RightForeArm',(1,0,0),-.35*spread)
 rotate('Spine',(1,0,0),.16*spread);rotate('Head',(1,0,0),-.18*spread)
 rotate('LeftUpLeg',(1,0,0),(.3+.1*wave)*spread);rotate('RightUpLeg',(1,0,0),(-.2-.1*wave)*spread)
 rotate('LeftLeg',(1,0,0),-.4*spread);rotate('RightLeg',(1,0,0),-.2*spread)
 for b in arm.pose.bones:b.keyframe_insert('rotation_quaternion',frame=f);b.keyframe_insert('location',frame=f)
action.use_fake_user=True;arm.animation_data.action=None
for track in arm.animation_data.nla_tracks:track.mute=False
track=arm.animation_data.nla_tracks.new();track.name='fall';track.strips.new('fall',1,action)
sc.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
 if obj.type in ['ARMATURE','MESH','EMPTY'] and not obj.hide_render and obj.name!='Icosphere':obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(BASE/'exports'/'arandu_player_fall.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=False)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models'/'arandu_player_fall.blend'),copy=True)
