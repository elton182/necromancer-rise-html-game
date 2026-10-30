"""Anima os rigs importados de lobo/aranha; use -- --character=wolf|spider."""
from pathlib import Path
import bpy, math, sys
from mathutils import Vector, Quaternion
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'scripts'))
from common import reset_scene
reset_scene()
character=next((a.split('=',1)[1] for a in sys.argv if a.startswith('--character=')),'wolf')
source={'wolf':'wolf_creature','spider':'low_poly_spider'}[character]
bpy.ops.import_scene.gltf(filepath=str(BASE/'reference/imported_enemies'/f'{source}.glb'))
sc=bpy.context.scene;sc.render.fps=24
arm=next(o for o in sc.objects if o.type=='ARMATURE')
for o in list(sc.objects):
    if o.type=='MESH' and not any(m.type=='ARMATURE' for m in o.modifiers):bpy.data.objects.remove(o,do_unlink=True)
body=next(o for o in sc.objects if o.type=='MESH');body.name=character.title()+'Body'
root=next(b for b in arm.pose.bones if b.parent is None)
def rotate(b,axis,angle):
    local=b.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
    b.rotation_quaternion=Quaternion(local.normalized(),angle) @ b.rotation_quaternion
specs={'idle':48,'walk':24,'attack':18,'hit':8,'death':24,'recover':12}
# O lobo também uiva (howl): cabeça e peito se erguem, seguram o grito e voltam.
specs.update({'windup':18,'charge':16,'howl':24} if character=='wolf' else {'bite_windup':12,'bite':12})
# Imported labels are unreliable: find limb chains from their actual hierarchy.
if character=='spider':
    spine=arm.pose.bones['tripo::Spine_0']
    chains=[b for b in spine.children if len(b.children)>0]
    chains.sort(key=lambda b:(b.bone.head_local.x,b.bone.head_local.y))
else:
    chains=[arm.pose.bones[n] for n in ('bone_5','tripo::0_Right_Limb_0','tripo::1_Left_Limb_0','tripo::1_Right_Limb_0')]
arm.animation_data_create()
for name,length in specs.items():
    a=bpy.data.actions.new(name);a.use_fake_user=True;arm.animation_data.action=a
    for f in range(length+1):
        u=f/length
        for b in arm.pose.bones:b.rotation_mode='QUATERNION';b.rotation_quaternion=Quaternion();b.location=(0,0,0)
        if name in ('walk','charge'):
            for i,b in enumerate(chains):
                phase=u*math.tau+(i%2)*math.pi
                rotate(b,(0,0,1) if character=='spider' else (1,0,0),.16*math.sin(phase))
                if b.children:rotate(b.children[0],(1,0,0),.22*max(0,math.sin(phase)))
        elif name=='idle':rotate(arm.pose.bones['tripo::Spine_0'],(1,0,0),.016*math.sin(u*math.tau))
        elif name in ('attack','bite','windup','bite_windup','recover'):
            k=math.sin(u*math.pi) if name in ('attack','bite') else u if 'windup' in name else 1-u
            target=arm.pose.bones.get('tripo::Head_0') or arm.pose.bones['tripo::Spine_0']
            rotate(target,(1,0,0),-.2*k)
            for b in chains:rotate(b,(1,0,0),.08*k)
        elif name=='howl':
            k=(lambda x:x*x*(3-2*x))(min(1,u/.25))*(1-(lambda x:x*x*(3-2*x))(max(0,min(1,(u-.85)/.15))))
            rotate(arm.pose.bones['tripo::Head_0'],(1,0,0),-.95*k);rotate(arm.pose.bones['tripo::Spine_0'],(1,0,0),-.05*k+.015*math.sin(u*math.tau*6)*k)
        elif name=='hit':rotate(root,(0,1,0),.15*math.sin(u*math.pi))
        elif name=='death':
            k=min(1,u*1.4);rotate(root,(0,1,0),1.45*k)
            for i,b in enumerate(chains):rotate(b,(1,0,0),(.4 if i%2 else -.4)*k)
        for b in arm.pose.bones:
            b.keyframe_insert('rotation_quaternion',frame=f+1)
    a['loop']=name in ('idle','walk','charge')
arm.animation_data.action=bpy.data.actions['idle'];arm.animation_data.action_slot=bpy.data.actions['idle'].slots[0]
sc.frame_set(1);sc.frame_end=49
bpy.ops.object.select_all(action='DESELECT')
for o in (arm,body):o.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(BASE/'exports'/f'v2_enemy_{character}.glb'),export_format='GLB',use_selection=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_force_sampling=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models'/f'v2_enemy_{character}.blend'))
print('ENEMY_EXPORTED',character,list(specs))
