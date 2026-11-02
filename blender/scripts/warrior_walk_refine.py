"""Retima as cinco poses manuais do usuário e mantém o escudo discreto."""
from pathlib import Path
import bpy,json
from mathutils import Quaternion
ROOT=Path(__file__).resolve().parents[1]
RIGHT=['RightArm','RightForeArm','RightHand']
LEFT=['LeftArm','LeftForeArm','LeftHand']

def capture_walk(rig):
    scene=bpy.context.scene;frame=scene.frame_current;poses=[]
    try:
        for f in range(1,6):
            scene.frame_set(f)
            poses.append({name:list(rig.pose.bones['mixamorig:'+name].rotation_quaternion) for name in RIGHT})
    finally:scene.frame_set(frame)
    path=ROOT/'reference/warrior/walk_user_poses.json'
    path.write_text(json.dumps({'source_frames':[1,2,3,4,5],'cycle_frames':[1,4,7,10,13,16,19,22,25],'poses':poses},indent=2),encoding='utf-8')
    return path

def refine_walk(rig,path=None):
    data=json.loads((path or ROOT/'reference/warrior/walk_user_poses.json').read_text(encoding='utf-8'))
    action=next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='walk')
    scene=bpy.context.scene;old=scene.frame_current;previous=rig.animation_data.action;rig.animation_data.action=action
    base=[]
    for f in range(1,26):
        scene.frame_set(f);base.append({name:rig.pose.bones['mixamorig:'+name].rotation_quaternion.copy() for name in LEFT})
    for f in range(1,26):
        scene.frame_set(f)
        phase=(f-1)/24;progress=(phase*2 if phase<=.5 else (1-phase)*2)*4
        index=min(3,int(progress));u=progress-index;u=u*u*(3-2*u)
        for name in RIGHT:
            a=Quaternion(data['poses'][index][name]);b=Quaternion(data['poses'][index+1][name])
            bone=rig.pose.bones['mixamorig:'+name];bone.rotation_quaternion=a.slerp(b,u);bone.keyframe_insert('rotation_quaternion',frame=f,group=bone.name)
        for name in LEFT:
            bone=rig.pose.bones['mixamorig:'+name];bone.rotation_quaternion=base[0][name].slerp(base[f-1][name],.2);bone.keyframe_insert('rotation_quaternion',frame=f,group=bone.name)
    rig.animation_data.action=previous;scene.frame_set(old)
    print('Walk: cinco poses manuais distribuídas em 25 frames; escudo com 20% da oscilação anterior.')
