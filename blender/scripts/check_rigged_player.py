"""Confere as poses solicitadas na cena editável, sem renderizar."""
from pathlib import Path
import bpy, json
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/rigged_player.blend'))
arm=bpy.data.objects['Armature'];sc=bpy.context.scene
def bone(name):return arm.pose.bones['mixamorig:'+name]
def frame(action,f):
    act=bpy.data.actions[action];arm.animation_data.action=act;arm.animation_data.action_slot=act.slots[0]
    sc.frame_set(f);bpy.context.view_layer.update()
frame('idle',1)
gap=abs(bone('LeftFoot').head.x-bone('RightFoot').head.x)
assert gap<.15,('pés ainda afastados',gap)
samples=[]
for f in (3,7):
    frame('walk',f)
    samples.append((bone('RightFoot').head.y,bone('LeftHand').head.y,
                    bone('LeftFoot').head.y,bone('RightHand').head.y))
leg_delta=samples[0][0]-samples[1][0]
hand_delta=samples[0][1]-samples[1][1]
assert abs(leg_delta)>.05 and abs(hand_delta)>.05,(leg_delta,hand_delta)
assert leg_delta*hand_delta>0,('perna direita e mão esquerda devem avançar juntas',samples)
left_foot_delta=samples[0][2]-samples[1][2]
right_hand_delta=samples[0][3]-samples[1][3]
assert left_foot_delta*hand_delta<0,('braço e perna esquerdos devem se opor',samples)
assert abs(right_hand_delta)<.03,('mão do cajado deve manter a pegada',samples)
staff=bpy.data.objects['ImportedStaff']
assert staff.parent==arm and staff.parent_bone=='mixamorig:RightHand'
for action in ('idle','walk','cast'):
    for f in (1,3):
        frame(action,f)
        assert bone('RightHand').head.y<bone('RightArm').head.y-.1,'Pegada precisa ficar à frente'
        vertical=staff.matrix_world.to_3x3().col[2].normalized()
        assert vertical.z>.999,'Cajado precisa permanecer vertical'
        assert bone('RightHand').head.x<bone('RightArm').head.x-.02,'Braço precisa ficar afastado na lateral'
assert tuple(bpy.context.view_layer.freestyle_settings.linesets[0].linestyle.color)==(0,0,0)
frame('cast',3)
reach=bone('LeftHand').head.y-bone('LeftArm').head.y
assert reach<-.18,('mão precisa estar à frente',reach)
b=bone('LeftHand');forward=(b.bone.tail_local-b.bone.head_local).normalized()
across=(bone('LeftHandIndex1').bone.head_local-bone('LeftHandPinky1').bone.head_local).normalized()
normal=forward.cross(across).normalized()
delta=b.matrix.to_3x3() @ b.bone.matrix_local.to_3x3().inverted()
palm=(delta @ normal).normalized();fingers=(delta @ forward).normalized()
assert palm.y<-.9,('palma não aponta para frente',tuple(palm))
assert fingers.z>.9,('dedos não apontam para cima',tuple(fingers))
assert sc.get('combat_shader')=='cel-three-bands-v1'
material=next(m for m in bpy.data.materials if m.use_nodes and any(n.type=='TEX_IMAGE' for n in m.node_tree.nodes))
ramp=next(n for n in material.node_tree.nodes if n.type=='VALTORGB')
assert ramp.color_ramp.interpolation=='CONSTANT' and len(ramp.color_ramp.elements)==3
mix=next(n for n in material.node_tree.nodes if n.type=='MIX')
assert mix.inputs[7].is_linked,'Textura original precisa alimentar o cel shading'
report=dict(footGap=gap,walkRightFootDelta=leg_delta,walkLeftHandDelta=hand_delta,
            walkLeftFootDelta=left_foot_delta,walkRightHandDelta=right_hand_delta,
            castForwardReach=reach,palmNormal=list(palm),fingerDirection=list(fingers),
            shader=sc['combat_shader'],actions=list(bpy.data.actions.keys()))
(BASE/'previews/rigged_player_pose_validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
