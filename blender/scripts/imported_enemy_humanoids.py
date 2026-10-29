"""Humanoides importados: use -- --character=knight|mage|thief|griffin."""
from pathlib import Path
import bpy, math, sys
import numpy as np
from mathutils import Vector, Quaternion, Matrix
BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE / 'scripts'))
from common import reset_scene
reset_scene()
character=next((a.split('=',1)[1] for a in sys.argv if a.startswith('--character=')), 'knight')
sources={'knight':'medieval_knight','mage':'hooded_mage','thief':'fantasy_hooded_thief','griffin':'griffin_like_humanoid'}
source=sources[character]
sc = bpy.context.scene
sc.render.fps = 24
bpy.ops.import_scene.gltf(filepath=str(BASE/'reference/imported_enemies'/f'{source}.glb'))
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
for o in list(sc.objects):
    if o.type == 'MESH' and not any(m.type == 'ARMATURE' for m in o.modifiers):
        bpy.data.objects.remove(o, do_unlink=True)
body = next(o for o in sc.objects if o.type == 'MESH')
body.name = character.title()+'Body'

def bone(n): return arm.pose.bones['mixamorig:'+n]
def pose_matrix(b):
    rest=b.bone.matrix_local
    local=b.rotation_quaternion.to_matrix().to_4x4()
    return pose_matrix(b.parent) @ b.parent.bone.matrix_local.inverted() @ rest @ local if b.parent else rest @ local
def aim(n, direction):
    b=bone(n); rest=b.bone.matrix_local.to_3x3()
    parent=pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted() if b.parent else Matrix.Identity(3)
    target=parent.inverted() @ Vector(direction).normalized()
    delta=(b.bone.tail_local-b.bone.head_local).normalized().rotation_difference(target)
    b.rotation_quaternion=(rest.inverted() @ delta.to_matrix() @ rest).to_quaternion()
def rotate(n, axis, angle):
    b=bone(n); local=b.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
    b.rotation_quaternion=Quaternion(local.normalized(),angle) @ b.rotation_quaternion

def accessory(file, name, hand, size, rotation, grip):
    before=set(sc.objects)
    bpy.ops.import_scene.gltf(filepath=str(BASE/'reference/imported_enemies'/file))
    obj=next(o for o in sc.objects if o not in before and o.type=='MESH')
    obj.name=name
    # Bake original transforms; centre and orient around the actual grip in source space.
    obj.data.transform(obj.matrix_world);obj.matrix_world=Matrix.Identity(4)
    lo=Vector(tuple(min(v.co[i] for v in obj.data.vertices) for i in range(3)))
    hi=Vector(tuple(max(v.co[i] for v in obj.data.vertices) for i in range(3)))
    centre=lo+(hi-lo)*Vector(grip)
    scale=size/max(hi-lo)
    if name in ('KnightSword','ThiefDagger'):
        points=np.array([v.co[:] for v in obj.data.vertices]);mean=points.mean(axis=0)
        values,axes=np.linalg.eigh(np.cov((points-mean).T));axis=axes[:,-1]
        if axis[0]<0:axis=-axis
        distances=(points-mean) @ axis
        # The handle is at the low-X end; use its centre, not the weapon bounds centre.
        length=float(distances.max()-distances.min())
        centre=Vector(mean+axis*(distances.min()+length*.12))
        scale=size/length
        q=Vector(axis).rotation_difference(Vector((0,0,1)))
    else:q=Quaternion(rotation[0],rotation[1])
    transform=Matrix.LocRotScale(Vector(),q,Vector((scale,)*3)) @ Matrix.Translation(-centre)
    obj.data.transform(transform)
    obj.parent=arm;obj.parent_type='BONE';obj.parent_bone='mixamorig:'+hand
    bpy.context.view_layer.update()
    # In bind pose weapons are defined in armature axes, then follow the hand rigidly.
    handbone=bone(hand).bone
    palm=handbone.head_local+(handbone.tail_local-handbone.head_local).normalized()*.055+Vector((0,-.01,-.012))
    obj.matrix_world=arm.matrix_world @ Matrix.Translation(palm)
    return obj

equipment=[]
if character=='knight':
    equipment.append(accessory('medieval_sword.glb','KnightSword','RightHand',.7,((0,1,0),math.pi/2),(.18,.5,.5)))
    equipment.append(accessory('polygonal_shield.glb','KnightShield','LeftHand',.43,((1,0,0),math.pi/2),(.5,.5,.5)))
elif character=='thief':equipment.append(accessory('dagger.glb','ThiefDagger','RightHand',.32,((0,1,0),0),(.15,.5,.5)))
elif character=='mage':equipment.append(accessory('wooden_fire_staff.glb','MageStaff','RightHand',.95,((0,1,0),0),(.5,.5,.36)))

specs={'idle':(48,True),'walk':(24,True),'attack':(18,False),'heavy_windup':(18,False),'heavy_attack':(12,False),'recover':(12,False),'hit':(8,False),'death':(24,False)}
if character=='mage':specs={'idle':(48,True),'walk':(24,True),'attack':(18,False),'cast_windup':(18,False),'cast':(12,False),'eruption_windup':(24,False),'eruption_cast':(12,False),'recover':(12,False),'hit':(8,False),'death':(24,False)}
elif character in ('thief','griffin'):
    prefix='stab' if character=='thief' else 'claw'
    specs={'idle':(48,True),'walk':(24,True),'attack':(18,False),prefix+'_windup':(10,False),prefix:(10,False),'recover':(12,False),'hit':(8,False),'death':(24,False)}
arm.animation_data_create()
for name,(length,loop) in specs.items():
    action=bpy.data.actions.new(name);action.use_fake_user=True
    arm.animation_data.action=action
    for f in range(length+1):
        u=f/length
        for b in arm.pose.bones:
            b.rotation_mode='QUATERNION';b.rotation_quaternion=Quaternion();b.location=(0,0,0)
        aim('LeftArm',(.25,-.2,-1));aim('LeftForeArm',(-.15,-1,.25))
        aim('RightArm',(-.2,-.15,-1));aim('RightForeArm',(-.1,-.7,.4))
        for side in ('Left','Right'):
            for digit in ('Index','Middle','Ring','Pinky'):
                for joint in (1,2,3):rotate(side+'Hand'+digit+str(joint),(0,1,0),.9 if side=='Left' else -.9)
        if name=='idle':rotate('Spine2',(1,0,0),.018*math.sin(u*math.tau))
        if name=='walk':
            swing=math.sin(u*math.tau)
            rotate('LeftUpLeg',(1,0,0),.38*swing);rotate('RightUpLeg',(1,0,0),-.38*swing)
            rotate('LeftLeg',(1,0,0),.45*max(0,-swing));rotate('RightLeg',(1,0,0),.45*max(0,swing))
            rotate('Spine',(0,0,1),.06*swing)
        if name in ('attack','heavy_windup','heavy_attack','recover'):
            t=.75+u*.25 if name=='attack' else u*.75 if name=='heavy_windup' else .75+u*.25 if name=='heavy_attack' else .8+u*.2
            lift=min(1,t/.45) if t<.45 else max(0,1-(t-.45)/.3)
            aim('RightArm',(-.25,-.3,-1+1.9*lift));aim('RightForeArm',(-.15,-.8,.2+.8*lift))
            rotate('Spine2',(0,0,1),-.25*math.sin(t*math.tau))
        if character=='mage':
            aim('RightArm',(-.25,-.2,-1));aim('RightForeArm',(-.15,-.75,.25))
            if name in ('attack','cast','cast_windup','eruption_windup','eruption_cast'):
                release=1-u if name in ('attack','cast','eruption_cast') else u
                aim('LeftArm',(.15,-1,-.7+.8*release));aim('LeftForeArm',(-.2,-1,.4-.4*release))
                rotate('Spine2',(1,0,0),.1*math.sin(u*math.pi))
        if character in ('thief','griffin') and name in ('attack','stab','stab_windup','claw','claw_windup'):
            reach=1-u if 'windup' not in name else .15*u
            aim('RightArm',(-.2,-.2-.8*reach,-1+reach));aim('RightForeArm',(-.1,-1,.25))
            rotate('Spine',(1,0,0),.15*reach)
        if name=='hit':rotate('Spine',(1,0,0),-.22*math.sin(u*math.pi))
        if name=='death':
            k=min(1,u*1.5);rotate('Hips',(1,0,0),-1.5*k);bone('Hips').location.y=-.15*k;bone('Hips').location.z=-.35*k
        for b in arm.pose.bones:
            b.keyframe_insert('rotation_quaternion',frame=f+1)
            if b.name.endswith('Hips'):b.keyframe_insert('location',frame=f+1)
    action['loop']=loop
from imported_humanoid_refinements import refine
refine(sc,arm,character,{name:bpy.data.actions[name] for name in specs})
if character=='griffin':specs['fly']=(24,True)
arm.animation_data.action=bpy.data.actions['idle']
arm.animation_data.action_slot=bpy.data.actions['idle'].slots[0]
sc.frame_set(1);sc.frame_end=49
bpy.ops.object.select_all(action='DESELECT')
for obj in (arm,*arm.children_recursive):obj.select_set(True)
bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(BASE/'exports'/f'v2_enemy_{character}.glb'),export_format='GLB',use_selection=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_force_sampling=True)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models'/f'v2_enemy_{character}.blend'))
print('ENEMY_EXPORTED',character,list(specs))
