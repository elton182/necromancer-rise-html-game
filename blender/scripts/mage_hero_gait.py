"""Locomoção humana do mago, usada pela autoria em mage_hero_t.py."""
import math
import bpy
from mathutils import Vector,Matrix,Euler

TAU=math.tau
STRIDE=.64
STRAFE_STRIDE=.40
def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def hermite(a,b,ma,mb,t):
    return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*ma+(-2*t**3+3*t*t)*b+(t**3-t*t)*mb
def foot_cycle(t,stride,lateral=False):
    """Apoio constante e balanço com tangentes contínuas nos contatos."""
    duty=.56;u=t%1;half=stride*duty*.5
    if u<duty:
        travel=half-stride*u;lift=0
        roll=-.18*(1-smooth(u/.12)) if u<.12 else .34*smooth((u-.36)/.20)
        support=True
    else:
        v=(u-duty)/(1-duty);tangent=-stride*(1-duty)
        travel=hermite(-half,half,tangent,tangent,v)
        lift=(.032 if lateral else .042)*math.sin(math.pi*v)**2
        roll=hermite(.34,-.18,-.35,0,v);support=False
    return {'travel':travel,'lift':lift,'roll':roll*(.22 if lateral else 1),'support':support}

class MageGait:
    def __init__(self,rig,body,staff,rot_world,arm,leg,staff_q,stride=STRIDE,strafe_stride=STRAFE_STRIDE):
        self.rig,self.body,self.staff=rig,body,staff
        self.rot,self.arm,self.leg,self.staff_q=rot_world,arm,leg,staff_q
        self.stride,self.strafe_stride=stride,strafe_stride
        self.bones={b.name.split(':')[-1]:b for b in rig.pose.bones}
        self.feet={s:self.bones[s+'Foot'].bone.head_local.copy() for s in ['Left','Right']}
        self.soles={s:[v.index for v in body.data.vertices if v.co.z<.055 and v.co.x*sign>0] for s,sign in [('Left',1),('Right',-1)]}
    def apply(self,name,t):
        lateral=name!='walk';sign=1 if name=='strafe_left' else -1
        phase=t*TAU;sway=math.sin(phase)
        for b in self.rig.pose.bones:
            b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0)
        # Apoio menos agachado e oscilação pequena: peso legível sem quicar.
        hip=Vector((.012*sway,.003*math.sin(phase*2),-.037-.005*math.cos(phase*2)))
        if lateral:hip=Vector((.018*sway,0,-.043-.004*math.cos(phase*2)))
        self.rot('Hips',(.018,.035*sway,-.070*sway if not lateral else .035*sway))
        self.rot('Spine',(.026,-.018*sway,.020*sway))
        self.rot('Spine1',(.025,0,.022*sway))
        self.rot('Spine2',(.018,.010*sway,.033*sway+(.065*sign if lateral else 0)))
        self.rot('Neck',(-.020,0,-.012*sway))
        self.rot('Head',(-.025,-.013*sway,-.022*sway-(.035*sign if lateral else 0)))
        self.rot('LeftShoulder',(.020*math.cos(phase-.2),0,.018*sway))
        self.rot('RightShoulder',(-.010*math.cos(phase-.2),0,-.012*sway))
        bpy.context.view_layer.update()
        hips=self.bones['Hips'];mat=hips.matrix.copy();mat.translation+=hip;hips.matrix=mat
        bpy.context.view_layer.update()
        for side,offset,s in [('Left',0,1),('Right',.5,-1)]:
            p=foot_cycle(t+offset,self.strafe_stride if lateral else self.stride,lateral)
            target=self.feet[side].copy()
            if lateral:
                # Passo cruzado: a perna de acompanhamento passa por trás.
                # Trilhos separados em profundidade mantêm as botas afastadas
                # no cruzamento, sem mover o pé durante seu apoio no chão.
                target.x=s*.055+sign*p['travel']
                target.y+=-.060 if s==sign else .100
            else:target.x=s*.102;target.y-=p['travel']
            target.z+=p['lift']
            bank=.025*s*math.sin((t+offset)*TAU) if lateral else 0
            yaw=s*.035+(sign*.04 if lateral else 0)
            q=Euler((p['roll'],bank,yaw)).to_quaternion()@self.bones[side+'Foot'].bone.matrix_local.to_quaternion()
            self.rot(side+'ToeBase',(-max(0,p['roll'])*.9,0,0))
            for iteration in range(2):
                self.leg(side,target,target+Vector((s*.025,-.30,.15)))
                self.bones[side+'Foot'].matrix=Matrix.LocRotScale(target,q,Vector((1,1,1)))
                bpy.context.view_layer.update()
                ev=self.body.evaluated_get(bpy.context.evaluated_depsgraph_get())
                low=min(ev.data.vertices[i].co.z for i in self.soles[side])
                target.z+=p['lift']-low
        swing=math.cos(phase-.18)
        if lateral:
            left=Vector((.185,-.010+.022*swing,.430+.006*math.sin(phase-.3)))
            right=Vector((-.205,-.10+.010*swing,.515+.006*math.sin(phase*2-.3)))
        else:
            left=Vector((.182+.008*sway,-.012+.055*swing,.427+.012*(1-swing)*.5))
            right=Vector((-.205,-.108+.012*math.cos(phase-.35),.515+.004*math.sin(phase*2-.35)))
        self.arm('Left',left,self.bones['LeftArm'].head+Vector((.015,.10,-.22)))
        self.arm('Right',right,right+Vector((-.16,.12,-.07)),self.staff_q(.12+.022*math.cos(phase-.4),-.025+.014*math.sin(phase-.55)))
        self.rot('RightHandFingers',(0,-1.45,0))
        lag=math.cos(phase-.45)
        self.rot('LeftRobe',(-.075*lag,.025*sway if lateral else 0,.012*sway))
        self.rot('RightRobe',(.075*lag,-.025*sway if lateral else 0,.012*sway))
        self.rot('HeadBeard',(.022*math.sin(phase-.7),.010*math.sin(phase-.4),0))
        self.rot('HeadHatTip',(.018*math.sin(phase-.85),0,.014*math.sin(phase-.55)))
