"""Propaga a pose manual do braço direito no frame 1 ao ciclo de giro.

Usa tornado_user_frame_1.json, capturado antes de avaliar outro frame.
Mantém o giro e os pés; incorpora também ajustes manuais da postura do tronco. Não exporta para o jogo.
"""
from pathlib import Path
from datetime import datetime
import bpy, json, hashlib
from mathutils import Quaternion

ROOT=Path(__file__).resolve().parents[1]
rig=bpy.data.objects['WarriorRig'];scene=bpy.context.scene;action=rig.animation_data.action
assert action and action.name=='tornado'
source=json.loads((ROOT/'reference/warrior/tornado_user_frame_1.json').read_text(encoding='utf-8'))
assert source['action']=='tornado' and source['frame']==1
bones=[b for b in rig.pose.bones if b.name.startswith('mixamorig:Right') and any(part in b.name for part in ['Shoulder','Arm','ForeArm','Hand'])]
def digest(a):
    data=[(c.data_path,c.array_index,[(list(k.co),k.interpolation,list(k.handle_left),list(k.handle_right)) for k in c.keyframe_points]) for l in a.layers for st in l.strips for bag in st.channelbags for c in bag.fcurves]
    return hashlib.sha256(json.dumps(data).encode()).hexdigest()
other={t.name:(t.strips[0].action,digest(t.strips[0].action)) for t in rig.animation_data.nla_tracks if t.name!='tornado'}
backup=ROOT/'backups'/('warrior_before_tornado_pose_transfer_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
curves={(c.data_path,c.array_index):c for l in action.layers for st in l.strips for bag in st.channelbags for c in bag.fcurves}
# O frame 25 ainda contém a base original do tronco antes da edição manual.
torso=[]
for short in ['Spine','Spine1','Spine2','Neck','Head']:
    b=rig.pose.bones['mixamorig:'+short];d=source['bones'][b.name]
    end=Quaternion([curves[(b.path_from_id('rotation_quaternion'),i)].evaluate(25) for i in range(4)])
    target=Quaternion(d['rotation_quaternion']);angle=end.rotation_difference(target).angle
    if min(angle,abs(6.283185307179586-angle))>1e-4:torso.append((b,target@end.inverted()))
first_needs_key=[]
for b in bones+[b for b,delta in torso]:
    d=source['bones'][b.name]
    for channel,values in [('location',d['location']),('rotation_quaternion',d['rotation_quaternion'])]:
        if any(abs(curves[(b.path_from_id(channel),i)].evaluate(1)-v)>1e-6 for i,v in enumerate(values)):
            first_needs_key.append((b,channel))

# A pose do braço fica fixa em relação ao tronco, acompanhando seu giro existente.
for frame in range(2,26):
    scene.frame_set(frame)
    for b,delta in torso:
        old=Quaternion([curves[(b.path_from_id('rotation_quaternion'),i)].evaluate(frame) for i in range(4)])
        b.rotation_quaternion=delta@old
        b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)
    for b in bones:
        d=source['bones'][b.name];b.location=d['location'];b.rotation_quaternion=d['rotation_quaternion']
        b.keyframe_insert('location',frame=frame,group=b.name)
        b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)
scene.frame_set(1)
for b in bones:
    d=source['bones'][b.name];b.location=d['location'];b.rotation_quaternion=d['rotation_quaternion']
# Se a alteração manual ainda não tinha chave, gravá-la para preservar a pose visível.
for b,channel in first_needs_key:b.keyframe_insert(channel,frame=1,group=b.name)

bpy.context.view_layer.update()
first_error=max(abs(v-source['bones'][b.name]['matrix'][i][j]) for b in rig.pose.bones for i,row in enumerate(b.matrix) for j,v in enumerate(row))
assert first_error<1e-5,('Frame 1 não corresponde à pose manual',first_error)
scene.frame_set(25);bpy.context.view_layer.update()
seam=max(abs(v-source['bones'][b.name]['matrix'][i][j]) for b in rig.pose.bones for i,row in enumerate(b.matrix) for j,v in enumerate(row))
assert seam<1e-5,('Ciclo não fecha',seam)
assert all(digest(a)==before for a,before in other.values()),'Uma ação anterior foi alterada.'
scene.frame_set(1)
rig.data.bones.active=rig.data.bones['mixamorig:RightHand']
for b in rig.pose.bones:b.select=b.name=='mixamorig:RightHand'
report={'action':'tornado','source_frame':1,'updated_frames':[2,25],'bones':[b.name for b in bones],'frame_1_pose_error':first_error,'loop_seam':seam,'manual_frame_1_channels_keyed':[(b.name,c) for b,c in first_needs_key],'other_actions_unchanged':True,'body_spin_and_legs_preserved':True,'user_torso_posture_applied':[b.name for b,delta in torso],'backup':str(backup),'exported':False}
(ROOT/'previews/warrior_tornado_user_pose.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/warrior.blend'))
print(json.dumps(report))
