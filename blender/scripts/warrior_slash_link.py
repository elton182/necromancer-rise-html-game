"""Liga a slash_2 ao frame 19 da slash_1 manual, sem refazer o início autoral."""
from pathlib import Path
import bpy,json
from datetime import datetime
from mathutils import Quaternion,Vector
ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene;rig=bpy.data.objects['WarriorRig']
first=rig.animation_data.action
assert first and first.name.split('.')[0]=='slash_1','Abra a slash_1 editada.'
second=next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='slash_2')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'backups'/('warrior_before_slash_link_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.blend')),copy=True)
def capture(action,frame):
    rig.animation_data.action=action;scene.frame_set(frame);bpy.context.view_layer.update()
    return {b.name:{'location':list(b.location),'rotation':list(b.rotation_quaternion),'scale':list(b.scale)} for b in rig.pose.bones}
locked={f:capture(first,f) for f in range(1,15)}
join=capture(first,19);target=capture(second,8)
path=ROOT/'reference/warrior/slash_combo_user_poses.json'
path.write_text(json.dumps({'slash_1_frames':locked,'join_frame':19,'join_pose':join,'slash_2_original_frame_8':target},indent=2),encoding='utf-8')
def scale_paths(action):
    return {c.data_path for l in action.layers for s in l.strips for b in s.channelbags for c in b.fcurves if c.data_path.endswith('.scale')}
def apply(action,frame,pose):
    rig.animation_data.action=action;scene.frame_set(frame);scales=scale_paths(action)
    for b in rig.pose.bones:
        p=pose[b.name];b.location=p['location'];b.rotation_quaternion=p['rotation'];b.scale=p['scale']
        b.keyframe_insert('location',frame=frame,group=b.name);b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)
        if b.path_from_id('scale') in scales or any(abs(v-1)>1e-6 for v in b.scale):b.keyframe_insert('scale',frame=frame,group=b.name)
# Materializar o frame 19 para a duração da ação incluir a pose de ligação.
apply(first,19,join)
for frame in range(1,8):
    u=(frame-1)/7;u=u*u*(3-2*u)
    pose={n:{'location':list(Vector(p['location']).lerp(Vector(target[n]['location']),u)),
             'rotation':list(Quaternion(p['rotation']).slerp(Quaternion(target[n]['rotation']),u)),
             'scale':list(Vector(p['scale']).lerp(Vector(target[n]['scale']),u))} for n,p in join.items()}
    apply(second,frame,pose)
for f,old in locked.items():
    now=capture(first,f)
    for name in now:
        for channel in now[name]:assert max(abs(a-b) for a,b in zip(now[name][channel],old[name][channel]))<1e-6,(f,name,channel)
a=capture(first,19);b=capture(second,1)
errors=[]
for name in a:
 for channel in a[name]:
  va=a[name][channel];vb=b[name][channel]
  difference=max(abs(x-y) for x,y in zip(va,vb))
  if channel=='rotation':difference=min(difference,max(abs(x+y) for x,y in zip(va,vb)))
  errors.append(difference)
error=max(errors)
assert error<1e-6,error
rig.animation_data.action=second;scene.frame_start=1;scene.frame_end=int(second.frame_range[1]);scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/warrior.blend'))
print('Frames 1–14 preservados. slash_1 frame 19 = slash_2 frame 1; diferença máxima:',error)
