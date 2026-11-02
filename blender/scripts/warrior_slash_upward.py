"""Slash_3 ascendente partindo do término manual de slash_2; não altera slash_2."""
from pathlib import Path
from datetime import datetime
import bpy,json,math
from mathutils import Vector,Quaternion,Matrix
ROOT=Path(__file__).resolve().parents[1]
rig=bpy.data.objects['WarriorRig'];scene=bpy.context.scene
active=rig.animation_data.action
second=active if active and active.name.split('.')[0]=='slash_2' else next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='slash_2')
third=next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='slash_3')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'backups'/('warrior_before_upward_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.blend')),copy=True)
rig.animation_data.action=second;scene.frame_set(int(second.frame_range[1]));bpy.context.view_layer.update()
base={b.name:{'location':list(b.location),'rotation':list(b.rotation_quaternion),'scale':list(b.scale)} for b in rig.pose.bones}
hand=rig.pose.bones['mixamorig:RightHand'];fore=rig.pose.bones['mixamorig:RightForeArm']
start=hand.head.copy();axis=(hand.head-fore.head).normalized()
blade=(hand.matrix.to_quaternion()@hand.bone.matrix_local.to_quaternion().inverted())@Vector((0,-1,0))
feet={side:(rig.pose.bones['mixamorig:'+side+'Foot'].head.copy(),rig.pose.bones['mixamorig:'+side+'Foot'].matrix.to_quaternion()) for side in ['Right','Left']}
ns={'__file__':str(ROOT/'scripts/warrior_pose.py')};exec(compile((ROOT/'scripts/warrior_pose.py').read_text(encoding='utf-8'),ns['__file__'],'exec'),ns)
arm_pose=ns['arm_pose'];leg_pose=ns['leg_pose']
(ROOT/'reference/warrior/slash_3_start_pose.json').write_text(json.dumps({'source_action':second.name,'source_frame':int(second.frame_range[1]),'bones':base},indent=2),encoding='utf-8')
for layer in list(third.layers):third.layers.remove(layer)
rig.animation_data.action=third

def ease(u):u=max(0,min(1,u));return u*u*(3-2*u)
def rotate(name,axis,angle):
    b=rig.pose.bones['mixamorig:'+name];basis=b.bone.matrix_local.to_quaternion()
    b.rotation_quaternion=Quaternion(base[b.name]['rotation'])@(basis.inverted()@Quaternion(axis,angle)@basis)
for frame in range(1,23):
    scene.frame_set(frame)
    for b in rig.pose.bones:
        data=base[b.name];b.location=data['location'];b.rotation_quaternion=data['rotation'];b.scale=data['scale']
    if frame>1:
        turn=ease((frame-1)/5);swing=ease((frame-6)/11)
        yaw=-.46*swing
        rotate('Hips',(0,0,1),yaw*.4);rotate('Spine',(0,0,1),yaw*.2);rotate('Spine1',(0,0,1),yaw*.2);rotate('Spine2',(0,0,1),yaw*.2)
        rotate('Head',(0,0,1),-yaw*.2)
        bpy.context.view_layer.update()
        hip=rig.pose.bones['mixamorig:Hips'];mat=hip.matrix.copy();mat.translation.z+=-.018*math.sin(math.pi*swing);hip.matrix=mat
        bpy.context.view_layer.update()
        for side,(position,rotation) in feet.items():
            leg_pose(rig,side,position,position+Vector((0,-.2,.12)))
            foot=rig.pose.bones['mixamorig:'+side+'Foot'];foot.matrix=Matrix.LocRotScale(foot.head.copy(),rotation,Vector((1,1,1)))
        preturn=Quaternion(axis,math.radians(50)*turn)@blade
        direction=preturn.lerp(Vector((-.55,-.75,.25)).normalized(),swing).normalized()
        # Diagonal da posição baixa ao lado direito, terminando ligeiramente acima do ombro.
        target=start.lerp(Vector((-.18,.23,.54)),swing)
        arm_pose(rig,'Right',target,(-.23,.39,.42),direction,.35*math.sin(math.pi*swing))
        # A entrada começa exatamente na pose manual e incorpora o solver progressivamente.
        for name in ['RightArm','RightForeArm','RightHand']:
            b=rig.pose.bones['mixamorig:'+name];b.rotation_quaternion=Quaternion(base[b.name]['rotation']).slerp(b.rotation_quaternion,turn)
    for b in rig.pose.bones:
        b.keyframe_insert('location',frame=frame,group=b.name);b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)
        if any(abs(v-1)>1e-6 for v in b.scale):b.keyframe_insert('scale',frame=frame,group=b.name)
# Conferir entrada sem salto na pose e preservar somente as ações requeridas.
scene.frame_set(1);bpy.context.view_layer.update()
for b in rig.pose.bones:
    data=base[b.name];assert max(abs(a-v) for a,v in zip(b.rotation_quaternion,data['rotation']))<1e-6,b.name
scene.frame_start=1;scene.frame_end=22;scene.frame_set(17)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/warrior.blend'))
print('slash_3: início idêntico ao fim de slash_2; punho frames 1–6; diagonal ascendente 6–17; final mantido 17–22.')
