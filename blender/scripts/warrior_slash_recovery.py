"""Continua a slash_1 manual do frame 14 em diante; preserva os frames 1–13."""
from pathlib import Path
import bpy,json
from mathutils import Quaternion,Vector
ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene;rig=bpy.data.objects['WarriorRig'];action=rig.animation_data.action
assert action and action.name.split('.')[0]=='slash_1','Selecione a ação slash_1 editada antes de executar.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'backups/warrior_before_slash_recovery.blend'),copy=True)
old_frame=scene.frame_current

def capture(frame):
    scene.frame_set(frame);bpy.context.view_layer.update()
    return {b.name:{'location':list(b.location),'rotation':list(b.rotation_quaternion),'scale':list(b.scale)} for b in rig.pose.bones}
locked={frame:capture(frame) for frame in range(1,14)}
start=locked[13];previous=locked[12]
next_action=next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='slash_2')
rig.animation_data.action=next_action;target=capture(1);rig.animation_data.action=action
# Preservar as poses autorais como fonte separada antes de qualquer continuação.
path=ROOT/'reference/warrior/slash_1_user_poses.json'
path.write_text(json.dumps({'action':action.name,'preserved_frames':locked,'target_action':'slash_2','recovery_frames':[14,22]},indent=2),encoding='utf-8')
scale_paths=set()
for layer in action.layers:
 for strip in layer.strips:
  for bag in strip.channelbags:
   scale_paths.update(c.data_path for c in bag.fcurves if c.data_path.endswith('.scale'))
follow={}
for name,pose in start.items():
    q=Quaternion(pose['rotation']);old=Quaternion(previous[name]['rotation']);delta=old.inverted()@q
    follow[name]={'rotation':q@Quaternion().slerp(delta,1.0),'location':Vector(pose['location'])+(Vector(pose['location'])-Vector(previous[name]['location']))*1.0}
for frame in range(14,23):
    scene.frame_set(frame)
    for bone in rig.pose.bones:
        name=bone.name
        if frame<=15:
            u=(frame-13)/2
            q=Quaternion(start[name]['rotation']).slerp(follow[name]['rotation'],u)
            location=Vector(start[name]['location']).lerp(follow[name]['location'],u)
            scale=Vector(start[name]['scale'])
        else:
            u=(frame-15)/7;u=u*u*(3-2*u)
            q=follow[name]['rotation'].slerp(Quaternion(target[name]['rotation']),u)
            location=follow[name]['location'].lerp(Vector(target[name]['location']),u)
            scale=Vector(start[name]['scale']).lerp(Vector(target[name]['scale']),u)
        bone.rotation_quaternion=q;bone.location=location;bone.scale=scale
        bone.keyframe_insert('rotation_quaternion',frame=frame,group=name)
        bone.keyframe_insert('location',frame=frame,group=name)
        if bone.path_from_id('scale') in scale_paths or any(abs(v-1)>1e-6 for v in scale):bone.keyframe_insert('scale',frame=frame,group=name)
# Confirmar que nenhum dos frames autorais foi alterado.
for frame in range(1,14):
    actual=capture(frame)
    for name in actual:
        for key in actual[name]:assert max(abs(a-b) for a,b in zip(actual[name][key],locked[frame][name][key]))<1e-6,(frame,name,key)
# A trilha de exportação deve apontar à ação que o usuário está de fato editando.
track=next(t for t in rig.animation_data.nla_tracks if t.name=='slash_1')
track.strips[0].action=action
rig.animation_data.action=action;scene.frame_start=1;scene.frame_end=22;scene.frame_set(14)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/warrior.blend'))
print('Frames 1–13 preservados e conferidos. Continuação 14–15; recuperação 16–22 até a entrada de slash_2.')
