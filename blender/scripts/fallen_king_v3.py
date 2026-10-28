"""Estudo de movimento com direções anatômicas em espaço do personagem."""
from pathlib import Path
import bpy,math
from mathutils import Vector,Matrix
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/boss_fallenKing_v2.blend'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
rig.animation_data_create()
def aim(name,d):
    b=rig.pose.bones['mixamorig:'+name]
    bpy.context.view_layer.update()
    m=b.matrix.copy();q=m.to_quaternion()
    q=(q@Vector((0,1,0))).rotation_difference(Vector(d).normalized())@q
    b.matrix=Matrix.Translation(m.translation)@q.to_matrix().to_4x4()
    bpy.context.view_layer.update()
def lerp(a,b,t):return tuple(x+(y-x)*t for x,y in zip(a,b))
# Upper arm, forearm, blade direction: guard, coil, contact, follow-through.
poses=[((-.20,-.10,-1),(.05,-1,.25),(-.25,-.85,.5)),
       ((-.8,.25,.6),(.3,-.35,1),(.15,.65,1)),
       ((-.25,-1,-.15),(.2,-1,-.35),(.5,-1,-.8)),
       ((.4,-.7,-.7),(.9,-.4,-.25),(1,-.1,-.65))]
for name in ('idle','walk','windup','attack','recover','cast','death'):
    action=bpy.data.actions.new(name);action.use_fake_user=True;rig.animation_data.action=action
    for frame in range(1,49):
        sc=bpy.context.scene;sc.frame_set(frame);t=(frame-1)/48
        for b in rig.pose.bones:
            b.rotation_mode='QUATERNION';b.matrix_basis=Matrix.Identity(4)
        bpy.context.view_layer.update()
        phase=math.sin(t*math.tau)
        idx=0;k=0
        if name=='windup':idx=0;k=(frame-1)/47;k=k*k*(3-2*k)
        elif name=='attack':idx=1;k=min(1,(frame-1)/24);k=k*k*(3-2*k)
        elif name=='recover':idx=3;k=(frame-1)/47;k=k*k*(3-2*k)
        p=poses[0]
        if name in ('windup','attack','recover'):
            other=poses[0] if idx==3 else poses[idx+1]
            p=tuple(lerp(a,b,k) for a,b in zip(poses[idx],other))
            if name=='attack' and frame>25:
                p=tuple(lerp(a,b,(frame-25)/23) for a,b in zip(poses[2],poses[3]))
        hips=rig.pose.bones['mixamorig:Hips']
        hips.location.z=-.008*(1-math.cos(t*math.tau*2)) if name=='walk' else 0
        aim('Spine',(0,-.08,1));aim('Spine1',(0,-.06,1))
        aim('RightArm',p[0]);aim('RightForeArm',p[1]);aim('RightHand',p[2])
        aim('LeftArm',(.22,-.12,-1));aim('LeftForeArm',(-.12,-1,-.35));aim('LeftHand',(-.1,-1,-.4))
        if name=='walk':
            for side,sign in [('Left',1),('Right',-1)]:
                swing=phase*sign
                aim(side+'UpLeg',(.20*sign,-.36*swing,-1))
                aim(side+'Leg',(.08*sign,.33*swing,-1))
                aim(side+'Foot',(.10*sign,-1,-.4))
            aim('LeftArm',(.22,.18*phase,-1));aim('LeftForeArm',(-.12,-.5,-1))
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion',frame=frame);b.keyframe_insert('location',frame=frame)
    for slot in action.slots:pass
rig.animation_data.action=bpy.data.actions['idle'];bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/boss_fallenKing_v3.blend'))
