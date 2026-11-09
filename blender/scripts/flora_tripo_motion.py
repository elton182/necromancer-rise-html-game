"""Importa os GLBs fornecidos e gera as duas cenas e ações da Druida.

Executar via MCP com __file__ definido. Fontes em reference/flora-tripo/.
Cria cenas próprias; não altera os modelos anteriores.
"""
import sys as _asset_sys
from pathlib import Path as _AssetPath
_asset_sys.path.insert(0, str(_AssetPath(__file__).resolve().parent))
from asset_paths import asset_path

import bpy, math, json
from pathlib import Path
from mathutils import Euler, Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]

# Eixos da mão na pose T: -X aponta pelos dedos, +Y atravessa a palma.
# Na pegada, os dedos apontam para a frente e a haste atravessa a palma.
PALM_X = Vector((.42,.89,.17)).normalized()
PALM_Z = PALM_X.cross(Vector((0,0,1))).normalized()
PALM = Matrix((PALM_X,PALM_Z.cross(PALM_X),PALM_Z)).transposed().to_quaternion()
UPPER = {side:Euler((0,math.radians(angle),0)).to_quaternion()
         for side,angle in [('Right',-66),('Left',76)]}

def human_arm_rotation(short,q):
    for side,upper in UPPER.items():
        if short==side+'Arm':return q @ upper
        if short==side+'ForeArm':
            return upper.inverted() @ q @ (PALM if side=='Right' else upper)
        if short==side+'Hand':
            basis=PALM if side=='Right' else upper
            return basis.inverted() @ q @ basis
    if short.startswith('RightHand') and short[-1:] in ('1','2','3'):
        if 'Thumb' in short:
            return Euler((math.radians(24),math.radians(-12),math.radians(24))).to_quaternion()
        return Euler((0,math.radians((-42,-58,-32)[int(short[-1])-1]),0)).to_quaternion()
    return q

def curves(action):
    return [fc for layer in action.layers for strip in layer.strips
            for bag in strip.channelbags for fc in bag.fcurves]

def make_action(rig, name, duration, poses):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data_create().action = action
    for t, pose in poses:
        for b in rig.pose.bones:
            short = b.name.split(':')[-1]
            rest = b.bone.matrix_local.to_quaternion()
            angles=list(pose.get(short, (0,0,0)))
            if 'druid_t' in name and name.endswith(('walk','strafe_left','strafe_right')):
                if short in ('LeftUpLeg','RightUpLeg'):angles=[-12,0,0]
                elif short in ('LeftLeg','RightLeg'):angles=[24,0,0]
            q = Euler(tuple(math.radians(v) for v in angles), 'XYZ').to_quaternion()
            if 'druid_t' in name:q=human_arm_rotation(short,q)
            if 'wolf' in name and name.endswith(('walk','strafe_left','strafe_right')) and short in ('LeftUpLeg','RightUpLeg','LeftLeg','RightLeg'):
                q.identity()
            b.rotation_mode = 'QUATERNION'
            b.rotation_quaternion = rest.inverted() @ q @ rest
            b.location = (0,0,0)
            if short == 'Hips':
                b.location = b.bone.matrix_local.to_3x3().inverted() @ Vector(pose.get('offset',(0,0,0)))
            b.keyframe_insert('rotation_quaternion', frame=1+t*duration*30)
            b.keyframe_insert('location', frame=1+t*duration*30)
    for fc in curves(action):
        for k in fc.keyframe_points:
            k.interpolation='BEZIER'
            k.handle_left_type=k.handle_right_type='AUTO_CLAMPED'
    if name.endswith(('walk','strafe_left','strafe_right','claw_1','claw_2','howl')) or ('wolf' in name and name.endswith(('idle','leap'))):
        bake_feet(rig, action, duration, name)
    return action

def gallop_flight(t):
    for start,end in ((.32,.47),(.79,1.0)):
        if start<t<end:
            return math.sin(math.pi*(t-start)/(end-start))**2
    return 0

def gallop_step(t,side,front):
    # Galope de quatro batidas. As traseiras impulsionam, as dianteiras
    # recebem o peso e os dois pares recolhem entre os apoios.
    contact=(.47 if front else 0)+(.08 if side=='Left' else 0)
    phase=(t-contact)%1
    support=.24
    if phase<support:
        return support/2-phase,0
    u=(phase-support)/(1-support)
    travel=-support/2+u*u*(3-2*u)-(1-support)*u
    lift=(.085 if front else .11)*math.sin(math.pi*u)**2
    return travel,lift+.055*gallop_flight(t)

def wolf_forepaws(rig,name,end,stride,targets):
    scene=bpy.context.scene
    mesh=next(o for o in rig.children if o.type=='MESH')
    lateral='strafe' in name
    for side,sign in [('Left',1),('Right',-1)]:
        hand=rig.pose.bones['mixamorig:'+side+'Hand']
        palm=Euler((math.radians(-16),0,0)).to_quaternion()
        groups={g.index for g in mesh.vertex_groups if g.name.startswith(hand.name)}
        depth=-min((palm @ (v.co-hand.bone.head_local)).z for v in mesh.data.vertices
                   if any(w.group in groups and w.weight>.5 for w in v.groups))
        target=bpy.data.objects.new('Forepaw_'+side,None)
        scene.collection.objects.link(target);targets.append(target)
        active=name.endswith('claw_1' if side=='Right' else 'claw_2')
        for frame in range(1,end+1):
            t=(frame-1)/(end-1)
            point=Vector((sign*.215,-.248,depth))
            if name.endswith(('walk','strafe_left','strafe_right')):
                travel,lift=gallop_step(t,side,front=True)
                if lateral:point.x+=(1 if name.endswith('left') else -1)*stride*travel
                else:point.y-=stride*travel
                point.z+=lift
            elif active:
                # Retrai e abre a pata, lança-a à frente na liberação, cruza e assenta.
                rising=side=='Left'
                knots=[(0,(0,0,0)),(.31,(sign*.10,.06,.13 if rising else .20)),
                       (.2/.42,(-sign*.08,-.24,.23 if rising else .12)),
                       (.70,(-sign*.13,-.13,.26 if rising else .07)),(1,(0,0,0))]
                for (a,v),(b,w) in zip(knots,knots[1:]):
                    if t<=b:
                        u=(t-a)/(b-a);point+=Vector(v).lerp(Vector(w),u*u*(3-2*u));break
            elif name.endswith('leap'):
                flight=min(1,max(0,(t-.15)/(.47/.6-.15)))
                arc=math.sin(math.pi*flight)
                point.y-=.12*arc
                point.z+=.25*arc
            target.location=rig.matrix_world @ point
            target.keyframe_insert('location',frame=frame)
        forearm=rig.pose.bones['mixamorig:'+side+'ForeArm']
        ik=forearm.constraints.new('IK');ik.target=target;ik.chain_count=2;ik.use_stretch=False
        orient=hand.constraints.new('COPY_ROTATION');orient.target=target
        target.rotation_mode='QUATERNION'
        target.rotation_quaternion=palm @ hand.bone.matrix_local.to_quaternion()
        orient.target_space='WORLD';orient.owner_space='WORLD'

def bake_feet(rig, action, duration, name):
    """Passada com tornozelos guiados e IK de duas articulações, assada no GLB."""
    scene=bpy.context.scene
    end=round(duration*30)+1
    lateral='strafe' in name
    planted=name.endswith(('claw_1','claw_2','howl','idle'))
    direction=1 if name.endswith('strafe_left') else -1
    wolf='wolf' in name
    # Distância em unidades da fonte (antes da escala de apresentação).
    stride=(.98 if wolf else .64) if not lateral else (.58 if wolf else .38)
    targets=[]
    for side,shift in [('Left',0),('Right',.5)]:
        foot=rig.pose.bones['mixamorig:'+side+'Foot']
        origin=foot.bone.head_local.copy()
        if wolf and name.endswith(('walk','strafe_left','strafe_right')):
            mesh=next(o for o in rig.children if o.type=='MESH')
            groups={g.index for g in mesh.vertex_groups
                    if g.name.startswith(('mixamorig:'+side+'Foot','mixamorig:'+side+'Toe'))}
            origin.z-=min(v.co.z for v in mesh.data.vertices
                          if any(w.group in groups and w.weight>.5 for w in v.groups))
        if not wolf:
            # A pose de origem está aberta para apresentar o personagem.
            # Na locomoção os pés passam mais próximos da linha do quadril.
            center=rig.data.bones['mixamorig:Hips'].head_local.x
            origin.x=center+(origin.x-center)*.75
        target=bpy.data.objects.new('FootTarget_'+side,None)
        scene.collection.objects.link(target);targets.append(target)
        for frame in range(1,end+1):
            t=(frame-1)/(end-1)
            phase=(t+shift)%1
            # Meio ciclo de apoio. O pé recua à velocidade do ator: a
            # distância entre contatos do mesmo pé corresponde ao stride.
            # Antes percorria um stride inteiro em 60% do ciclo e escorregava.
            if phase<.5:
                travel=.25-phase; lift=0
            else:
                u=(phase-.5)/.5
                smooth=u*u*(3-2*u)
                travel=-.25+.5*smooth
                if not lateral:
                    travel-=.5*u*(1-u)*(1-2*u)
                lift=math.sin(math.pi*u)**2*(.045 if wolf else .032)
            roll=(math.sin(math.pi*max(0,(phase-.5)*2))*8) if phase>=.5 else 0
            if wolf and name.endswith(('walk','strafe_left','strafe_right')):
                travel,lift=gallop_step(t,side,front=False)
                roll=0
            if not wolf and not lateral:
                if phase<.12:roll=-9*(1-phase/.12)**2
                elif phase<.3:roll=0
                elif phase<.5:roll=18*((phase-.3)/.2)**2
                else:roll=18-27*smooth
                lift+=math.sin(math.radians(abs(roll)))*(.065 if roll>0 else .025)
            delta=Vector((direction*travel*stride,0,lift)) if lateral else Vector((0,-travel*stride,lift))
            if planted:delta=Vector((0,0,0))
            if wolf and name.endswith('leap'):
                flight=min(1,max(0,(t-.19)/(.86-.19)))
                arc=math.sin(math.pi*flight)
                delta=Vector((0,.09*arc,.18*arc))
            target.location=rig.matrix_world @ (origin+delta)
            target.keyframe_insert('location',frame=frame)
            # Mantém a orientação do pé no apoio: IK não pode arrastá-lo
            # pela rotação da canela. A ponta sobe discretamente no balanço.
            target.rotation_mode='QUATERNION'
            if planted:roll=0
            if wolf and name.endswith('leap'):roll=arc*14
            q=Euler((math.radians(roll),0,0)).to_quaternion()
            target.rotation_quaternion=q @ foot.bone.matrix_local.to_quaternion()
            target.keyframe_insert('rotation_quaternion',frame=frame)
        shin=rig.pose.bones['mixamorig:'+side+'Leg']
        ik=shin.constraints.new('IK');ik.target=target;ik.chain_count=2;ik.use_stretch=False
        thigh=rig.pose.bones['mixamorig:'+side+'UpLeg']
        pole=bpy.data.objects.new('KneePole_'+side,None)
        scene.collection.objects.link(pole);targets.append(pole)
        direction_to_knee=Vector((0,-1,0))
        if wolf:
            # O joelho do lobo abre para fora; o jarrete fica atrás.
            hip=thigh.bone.head_local
            leg_axis=(foot.bone.head_local-hip).normalized()
            rest_bend=shin.bone.head_local-hip
            direction_to_knee=(rest_bend-leg_axis*rest_bend.dot(leg_axis)).normalized()
        pole.location=rig.matrix_world @ (thigh.bone.head_local+direction_to_knee)
        ik.pole_target=pole
        # Calibra pelo eixo real do osso importado. Cada perna tem roll próprio.
        scene.frame_set(1)
        hip=thigh.head.copy()
        axis=(target.location-hip).normalized()
        toward=pole.location-hip
        toward=(toward-axis*toward.dot(axis)).normalized()
        best_score=-2
        for degrees in range(-180,180,5):
            ik.pole_angle=math.radians(degrees)
            bpy.context.view_layer.update()
            knee=shin.head-hip
            bend=(knee-axis*knee.dot(axis)).normalized()
            score=toward.dot(bend)
            if score>best_score:best_score,best_angle=score,ik.pole_angle
        ik.pole_angle=best_angle
        orient=foot.constraints.new('COPY_ROTATION');orient.target=target
        orient.target_space='WORLD';orient.owner_space='WORLD'
    if wolf and not name.endswith('howl'):
        wolf_forepaws(rig,name,end,stride,targets)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.nla.bake(frame_start=1,frame_end=end,step=1,only_selected=False,
        visual_keying=True,clear_constraints=True,use_current_action=True,bake_types={'POSE'})
    # A ação já tinha chaves fracionárias de preparação. Entre dois
    # quadros assados elas reintroduziriam a pose anterior ao IK.
    for fc in curves(action):
        for i in reversed(range(len(fc.keyframe_points))):
            key=fc.keyframe_points[i]
            if abs(key.co.x-round(key.co.x))>1e-4:fc.keyframe_points.remove(key,fast=True)
        fc.update()
    for target in targets:bpy.data.objects.remove(target,do_unlink=True)
    scene.frame_set(1)

def clips(wolf):
    out={}
    idle=[]; walk=[]
    for i in range(25):
        t=i/24; s=math.sin(t*math.tau); c=math.cos(t*math.tau)
        idle.append((t,{'Spine':(s*1.3,0,0),'Spine2':(s*.8,0,c*.7),'Head':(-s*.7,0,-c*.5),
                        'LeftArm':(s*1.5,0,0),'RightArm':(-s*1.5,0,0)}))
        p={'LeftUpLeg':(s*24,0,0),'RightUpLeg':(-s*24,0,0),
           'LeftLeg':(-max(0,-s)*30,0,0),'RightLeg':(-max(0,s)*30,0,0),
           'LeftFoot':(max(0,-s)*15-s*8,0,0),'RightFoot':(max(0,s)*15+s*8,0,0),
           'Spine2':(3 if wolf else 0,0,-s*4),'Head':(0,0,s*2),
           'LeftArm':(-s*(18 if wolf else 10),0,0),'RightArm':(s*(18 if wolf else 2),0,0),
           'offset':(0,0,abs(s)*.008)}
        walk.append((t,p))
    out['idle']=(2.4,idle);out['walk']=(.65 if wolf else .8,walk)
    def attack(name,duration,impact,prep,hit,hold=None):
        out[name]=(duration,[(0,{}),(impact*.5,prep),(impact,hit),(min(.88,impact+.18),hold or hit),(1,{})])
    if wolf:
        for side,sign in [('Right',1),('Left',-1)]:
            attack('claw_1' if sign==1 else 'claw_2',.42,.2/.42,
                   {'Spine2':(-5,0,sign*18),side+'Arm':(20,-sign*30,0),side+'ForeArm':(-15,0,0)},
                   {'Spine2':(14,0,-sign*22),side+'Arm':(-65,sign*15,0),side+'ForeArm':(-18,0,0),'Head':(-8,0,sign*8)})
        attack('howl',.8,.25/.8,{'Spine':(12,0,0),'Head':(8,0,0)},
               {'Spine':(-12,0,0),'Head':(-25,0,0),'LeftArm':(0,18,0),'RightArm':(0,-18,0)})
        out['leap']=(.6,[(0,{}),(.17,{'Spine':(18,0,0),'offset':(0,0,-.035)}),
            (.4,{'Spine':(14,0,0),'LeftArm':(-50,0,0),'RightArm':(-50,0,0),'offset':(0,0,.08)}),
            (.47/.6,{'Spine':(22,0,0),'LeftArm':(-30,0,0),'RightArm':(-30,0,0),'offset':(0,0,-.025)}),(1,{})])
    else:
        attack('cast',.45,.17/.45,{'Spine2':(-4,0,-8),'RightArm':(8,0,0)},
               {'Spine2':(8,0,10),'RightArm':(-30,0,0),'RightForeArm':(-12,0,0),'LeftArm':(-25,-12,0)})
        attack('cast_up',.7,.4/.7,{'Spine':(6,0,0),'Head':(5,0,0)},
               {'Spine':(-7,0,0),'RightArm':(-65,0,0),'LeftArm':(-45,-25,0),'Head':(-14,0,0)})
        attack('slam',.6,.33/.6,{'Spine':(-8,0,-5),'RightArm':(-30,0,0)},
               {'Spine':(16,0,4),'RightArm':(8,0,0),'LeftArm':(-12,-15,0),'offset':(0,0,-.018)})
    out['dodge']=(.5,[(0,{}),(.2,{'Spine':(25,0,0),'Head':(-12,0,0),'LeftUpLeg':(-25,0,0),'offset':(0,0,-.025)}),
                        (.65,{'Spine':(20,0,0),'RightUpLeg':(-25,0,0),'offset':(0,0,-.02)}),(1,{})])
    out['death']=(1.2,[(0,{}),(.2,{'Spine':(-10,0,0),'Head':(-15,0,0)}),
        (.65,{'Hips':(-65,0,12),'Spine':(-15,0,0),'offset':(0,0,-.22)}),
        (1,{'Hips':(-85,0,12),'Spine':(-5,0,0),'offset':(0,0,-.28)})])
    return polish(out, wolf)

def polish(out, wolf):
    """Contato, contraposição do tronco e recuperação sem pausa no impacto."""
    walk=[];idle=[]
    for i in range(49):
        t=i/48; phase=t*math.tau
        s=math.sin(phase); c=math.cos(phase)
        p={'Spine':(4 if wolf else 7,0,-s*3),
           'Spine2':(2 if wolf else 3,0,s*6),
           'Neck':(0 if wolf else -3,0,0),
           'Head':(-2 if wolf else -6,0,-s*2),
           'Hips':(0 if wolf else 3,c*1.5,s*3),
           'offset':(s*.009,-.018 if not wolf else 0,(-.035 if wolf else -.055)-math.cos(phase*2)*.007)}
        for side,offset in [('Left',0),('Right',math.pi)]:
            a=phase+offset; swing=max(0,-math.cos(a))
            p[side+'UpLeg']=(math.sin(a)*(22 if wolf else 18),0,0)
            p[side+'Leg']=(-swing*(32 if wolf else 26),0,0)
            p[side+'Foot']=(swing*20-math.sin(a)*10,0,0)
            p[side+'ToeBase']=(swing*8,0,0)
            # Cajado está na direita: pouco balanço, compensação do punho.
            arm=math.sin(a)*(12 if wolf else (8 if side=='Left' else 2))
            p[side+'Arm']=(-arm,0,0)
            p[side+'ForeArm']=(-swing*(10 if wolf else 5),0,0)
            p[side+'Hand']=(arm*.35,0,0)
        if not wolf:
            # Postura de marcha distinta da apresentação: ombro solto,
            # cotovelo flexionado e cajado transportado, sem usá-lo de bengala.
            p['LeftArm']=(-3+c*24,-4,0)
            p['LeftForeArm']=(-16-(1-c)*6,0,0)
            p['LeftShoulder']=(0,0,-s*3)
            p['RightArm']=(-4-c*4,0,-3)
            p['RightForeArm']=(-55,0,0)
            p['RightHand']=(62+c*2,0,0)
            p['RightShoulder']=(0,0,s*2)
        walk.append((t,p))
        breath=math.sin(phase); lag=math.sin(phase-.5)
        idle.append((t,{'Spine':(breath*(2 if wolf else 1),0,0),
            'Spine2':(lag,0,breath*.6),'Head':(-lag*.8,0,-breath*.4),
            'LeftShoulder':(breath,0,0),'RightShoulder':(breath,0,0),
            'LeftForeArm':(lag*.6,0,0),'RightHand':(-lag*.5,0,0)}))
    out['walk']=(.7 if wolf else .85,walk)
    for name,sign in [('strafe_left',1),('strafe_right',-1)]:
        poses=[]
        for i in range(49):
            t=i/48;s=math.sin(t*math.tau)
            poses.append((t,{'Hips':(0,s*1.5,0),'Spine':(0,-s*1.5,0),
                'Spine2':(3 if wolf else 6,0,0),'Head':(0 if wolf else -5,0,0),
                'LeftArm':(-10 if not wolf else 0,sign*s*3,0),
                'LeftForeArm':(-20 if not wolf else 0,0,0),
                'RightArm':(-10 if not wolf else 0,0,0),
                'RightForeArm':(-28 if not wolf else 0,0,0),
                'RightHand':(26 if not wolf else 0,0,0),
                'offset':(s*(.016 if wolf else .01),0,-.035-math.cos(t*math.tau*2)*.003)}))
        out[name]=(.8,poses)
    out['idle']=(2.8 if wolf else 3.2,idle)
    for name in (['claw_1','claw_2','howl'] if wolf else ['cast','cast_up','slam']):
        duration,keys=out[name]
        start,prep,hit,hold,end=keys
        impact=hit[0]; pose=dict(hit[1])
        sign=-1 if name=='claw_2' else 1
        prep_pose=dict(prep[1]);prep_pose['Hips']=(0,0,-sign*4)
        prep_pose['LeftUpLeg']=(-5,0,0);prep_pose['RightUpLeg']=(4,0,0)
        pose['Hips']=(0,0,sign*5)
        follow={k:tuple(vv*.65 for vv in v) for k,v in pose.items()}
        settle={k:tuple(vv*.15 for vv in v) for k,v in pose.items()}
        # A preparação segura a silhueta; o ataque acelera até a liberação.
        out[name]=(duration,[(0,{}),(impact*.62,prep_pose),
            (impact*.86,prep_pose),(impact,pose),
            (impact+(1-impact)*.32,follow),(.92,settle),(1,{})])
    # Aterrissagem comprimida seguida de recuperação, sem flutuar no impacto.
    if wolf:
        out['leap']=(.6,[(0,{}),(.16,{'Spine':(16,0,0),'LeftLeg':(-12,0,0),'RightLeg':(-12,0,0),'offset':(0,0,-.025)}),
            (.35,{'Spine':(8,0,0),'LeftArm':(-55,0,0),'RightArm':(-55,0,0),'LeftLeg':(-25,0,0),'RightLeg':(-25,0,0),'offset':(0,0,.1)}),
            (.65,{'Spine':(16,0,0),'LeftArm':(-35,0,0),'RightArm':(-35,0,0),'offset':(0,0,.035)}),
            (.47/.6,{'Spine':(28,0,0),'Head':(-14,0,0),'LeftLeg':(-18,0,0),'RightLeg':(-18,0,0),'offset':(0,0,-.03)}),
            (.9,{'Spine':(12,0,0),'Head':(-6,0,0),'offset':(0,0,-.01)}),(1,{})])
    return wolf_motion(out) if wolf else out

def wolf_motion(out):
    """Guarda comum e golpes com cadeia quadril → ombro → garra."""
    guard={'Spine':(4,0,0),'Spine2':(4,0,0),'Head':(-8,0,0),
           'LeftArm':(-14,-8,0),'RightArm':(-14,8,0),
           'LeftForeArm':(-18,0,0),'RightForeArm':(-18,0,0),
           'LeftHand':(-8,0,0),'RightHand':(-8,0,0)}
    for name,(duration,keys) in list(out.items()):
        if name=='death':continue
        result=[]
        for t,pose in keys:
            p=dict(pose)
            for bone,base in guard.items():
                v=p.get(bone,(0,0,0));p[bone]=tuple(a+b for a,b in zip(base,v))
            if name in ['walk','strafe_left','strafe_right']:
                p['Hips']=(3,0,math.sin(t*math.tau)*4)
                z=p.get('offset',(0,0,0));p['offset']=(z[0],-.012,z[2]-.018)
                if name=='walk':
                    contact=math.cos(t*math.tau)
                    p['LeftArm']=(-14+contact*16,-8,0)
                    p['RightArm']=(-14-contact*16,8,0)
            result.append((t,p))
        out[name]=(duration,result)
    def pose(**changes):return {**guard,**changes}
    for name,side,other,sign in [('claw_1','Right','Left',1),('claw_2','Left','Right',-1)]:
        prep=pose(Hips=(0,0,-sign*9),Spine=(0,0,-sign*8),Spine2=(-6,0,-sign*18),Head=(0,0,sign*10))
        prep['offset']=(.018*sign,.012,-.018)
        prep.update({side+'Arm':(10,sign*38,-sign*10),side+'ForeArm':(-35,0,0),other+'Arm':(-18,-sign*8,0)})
        hit=pose(Hips=(0,0,sign*9),Spine=(10,0,sign*10),Spine2=(10,0,sign*18),Head=(-12,0,-sign*15))
        hit['offset']=(-.014*sign,-.027,-.012)
        hit.update({side+'Arm':(-78,-sign*24,sign*8),side+'ForeArm':(-5,0,0),side+'Hand':(-18,0,sign*12),other+'Arm':(-8,-sign*16,0)})
        follow=pose(Hips=(0,0,sign*6),Spine=(8,0,sign*8),Spine2=(8,0,sign*12),Head=(-10,0,-sign*10))
        follow.update({side+'Arm':(-44,-sign*42,0),side+'ForeArm':(-20,0,0),side+'Hand':(-12,0,0)})
        out[name]=(.42,[(0,guard),(.2,prep),(.36,prep),(.2/.42,hit),(.68,follow),(.87,pose()),(1,guard)])
    out['howl']=(.7,[(0,guard),(.18,pose(Spine=(16,0,0),Head=(8,0,0))),
        (.25/.7,pose(Spine=(-8,0,0),Spine2=(-10,0,0),Head=(-32,0,0),Neck=(-10,0,0),LeftArm=(8,-28,0),RightArm=(8,28,0))),
        (.65,pose(Spine=(-6,0,0),Head=(-28,0,0),LeftArm=(5,-22,0),RightArm=(5,22,0))),(.9,guard),(1,guard)])
    # Tronco apoiado sobre a cintura escapular. A cabeça compensa a inclinação
    # para que o focinho continue apontando para a presa.
    for name in ['idle','walk','strafe_left','strafe_right','claw_1','claw_2']:
        duration,keys=out[name]
        quadruped=[]
        for t,original in keys:
            p=dict(original)
            phase=math.tau*t
            moving=name in ['walk','strafe_left','strafe_right']
            strike=name.startswith('claw_')
            for bone,angle in [('Hips',37),('Spine',16),('Spine1',6),('Spine2',5),('Neck',-22),('Head',-33)]:
                old=p.get(bone,(0,0,0))
                p[bone]=(angle+(old[0]*.4 if strike else 0),old[1],old[2]*.6)
            shift=p.get('offset',(0,0,0))
            p['offset']=(shift[0],-.005+(shift[1] if strike else 0),
                         -.195+(.007*math.sin(phase*2) if moving else shift[2]*.45))
            if moving:
                drive=math.sin(phase)
                p['LeftToeBase']=p['RightToeBase']=(0,0,0)
                p['Hips']=(37-7*drive,0,shift[0]*100)
                p['Spine']=(16+9*drive,0,0)
                p['Neck']=(-22-3*drive,0,0)
                p['offset']=(shift[0],-.005-.012*drive,
                             -.19+.025*drive+.055*gallop_flight(t))
            quadruped.append((t,p))
        out[name]=(duration,quadruped)
    # Carrega nas traseiras, estende durante o voo e recebe o impacto nas dianteiras.
    def leap_pose(depth,pitch,neck):
        return pose(Hips=(pitch,0,0),Spine=(14,0,0),Spine1=(6,0,0),
                    Spine2=(6,0,0),Neck=(-18,0,0),Head=(neck,0,0),offset=(0,0,depth))
    out['leap']=(.6,[(0,leap_pose(-.195,37,-33)),(.15,leap_pose(-.218,40,-35)),
        (.42,leap_pose(.035,28,-25)),(.62,leap_pose(-.005,32,-28)),
        (.47/.6,leap_pose(-.222,43,-36)),(.9,leap_pose(-.205,39,-34)),
        (1,leap_pose(-.195,37,-33))])
    return out

def blend_wolf_rest(rig,actions):
    scene=bpy.context.scene
    rig.animation_data.action=dict(actions)['idle'];scene.frame_set(1)
    base={b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in rig.pose.bones}
    for name,action in actions:
        if name not in ('howl','dodge','death'):continue
        rig.animation_data.action=action
        end=round(action.frame_range[1]);samples=[]
        for f in range(1,end+1):
            u=(f-1)/(end-1)
            w=min(1,u/.28,(1-u)/.32 if name!='death' else 1)
            if w>=1:continue
            scene.frame_set(f);w=w*w*(3-2*w)
            samples.append((f,[(b.name,base[b.name][0].lerp(b.location,w),
                                base[b.name][1].slerp(b.rotation_quaternion,w)) for b in rig.pose.bones]))
        for f,values in samples:
            for bone,pos,rot in values:
                b=rig.pose.bones[bone];b.location=pos;b.rotation_quaternion=rot
                b.keyframe_insert('location',frame=f);b.keyframe_insert('rotation_quaternion',frame=f)

def make_staff(rig):
    """Prop separado, rígido na mão direita; orientação de transporte na pose T."""
    wood=bpy.data.materials.new('Flora_staff_wood');wood.diffuse_color=(.22,.085,.025,1);wood.use_nodes=True
    crystal=bpy.data.materials.new('Flora_staff_crystal');crystal.diffuse_color=(.4,.8,.1,1);crystal.use_nodes=True
    for mat,color in [(wood,(.22,.085,.025,1)),(crystal,(.4,.8,.1,1))]:
        node=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');node.inputs['Base Color'].default_value=color;node.inputs['Roughness'].default_value=.65
    knuckle=rig.data.bones['mixamorig:RightHandMiddle1'].head_local
    grip=knuckle+Vector((-.006,0,-.023))
    inverse=PALM.inverted()
    verts=[];faces=[];indices=[]
    def point(v):return grip+inverse @ Vector(v)
    def branch(a,b,radius):
        a=Vector(a);b=Vector(b);q=(b-a).to_track_quat('Z','Y');start=len(verts)
        for center,r in [(a,radius),(b,radius*.78)]:
            for i in range(7):verts.append(point(center+q @ Vector((math.cos(i*math.tau/7)*r,math.sin(i*math.tau/7)*r,0))))
        for i in range(7):faces.append((start+i,start+(i+1)%7,start+(i+1)%7+7,start+i+7));indices.append(0)
        faces.extend([tuple(start+i for i in reversed(range(7))),tuple(start+7+i for i in range(7))]);indices.extend([0,0])
    for a,b,r in [((0,0,-.417),(0,0,.35),.016),((0,0,.35),(-.04,0,.48),.018),
                   ((-.04,0,.48),(-.085,0,.56),.012),((-.085,0,.56),(-.065,0,.64),.009),
                   ((0,0,.35),(.065,0,.47),.014),((.065,0,.47),(.075,0,.58),.01),
                   ((.075,0,.58),(.045,0,.63),.008)]:branch(a,b,r)
    start=len(verts)
    for v in [(0,0,.65),(0,0,.47),(-.038,0,.55),(0,-.025,.55),(.038,0,.55),(0,.025,.55)]:verts.append(point(v))
    for a,b in [(2,3),(3,4),(4,5),(5,2)]:faces.extend([(start,start+a,start+b),(start+1,start+b,start+a)]);indices.extend([1,1])
    data=bpy.data.meshes.new('Flora_staff');data.from_pydata(verts,[],faces);data.materials.append(wood);data.materials.append(crystal)
    obj=bpy.data.objects.new('Flora_staff',data);bpy.context.scene.collection.objects.link(obj);obj.parent=rig
    for poly,index in zip(data.polygons,indices):poly.material_index=index
    obj.vertex_groups.new(name='mixamorig:RightHand').add(list(range(len(verts))),1,'REPLACE')
    mod=obj.modifiers.new('Armature','ARMATURE');mod.object=rig

def main(wolf=False):
    stem='flora_tripo_wolf' if wolf else 'flora_tripo_druid_t'
    scene=bpy.data.scenes.new(stem)
    bpy.context.window.scene=scene
    bpy.context.view_layer.active_layer_collection=bpy.context.view_layer.layer_collection
    scene.render.fps=30
    old=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=asset_path(str(ROOT/'reference/flora-tripo'/('wolf-source.glb' if wolf else 'druid-t-source.glb'))))
    imported=set(bpy.data.objects)-old
    rig=next(o for o in imported if o.type=='ARMATURE')
    mesh=next(o for o in imported if o.type=='MESH' and o.parent==rig)
    # Icosphere é um auxiliar do arquivo Tripo, sem função no personagem.
    for o in imported-{rig,mesh}: bpy.data.objects.remove(o,do_unlink=True)
    rig.name=stem+'_rig';mesh.name=stem+'_mesh'
    if not wolf:
        make_staff(rig)
    actions=[]
    authored=clips(wolf)
    if not wolf:
        # A nova base exige poses de lançamento próprias, com o braço saindo
        # efetivamente da linha do tronco e a mão livre acompanhando o gesto.
        for name in ['cast','cast_up','slam']:
            duration,keys=authored[name];changed=[]
            for t,pose in keys:
                p=dict(pose)
                if 'RightArm' in p:
                    x,y,z=p['RightArm'];p['RightArm']=(x*1.5,y,z)
                if 'LeftArm' in p:
                    x,y,z=p['LeftArm'];p['LeftArm']=(x*1.3,y,z)
                changed.append((t,p))
            authored[name]=(duration,changed)
    for name,(duration,poses) in authored.items():
        a=make_action(rig,stem+'_'+name,duration,poses)
        actions.append((name,a))
    if wolf:blend_wolf_rest(rig,actions)
    rig.animation_data.action=None
    for name,a in actions:
        track=rig.animation_data.nla_tracks.new();track.name=name
        strip=track.strips.new(name,1,a);strip.name=name
        track.mute=True
    rig.animation_data.action=actions[0][1]
    scene.frame_set(1);scene.frame_end=73
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True)
    for child in rig.children:child.select_set(True)
    bpy.context.view_layer.objects.active=rig
    # Salva somente esta cena e suas dependências, sem levar cenas do usuário.
    bpy.data.libraries.write(asset_path(str(ROOT/'models'/f'{stem}.blend')),{scene},fake_user=True)
    rig.animation_data.action=None
    for track in rig.animation_data.nla_tracks: track.mute=False
    bpy.ops.export_scene.gltf(filepath=asset_path(str(ROOT/'exports'/f'{stem}.glb')),use_selection=True,export_format='GLB',
        use_active_scene=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_anim_slide_to_zero=True)
    for track in rig.animation_data.nla_tracks: track.mute=True
    rig.animation_data.action=actions[0][1]
    print(json.dumps({'model':stem,'vertices':len(mesh.data.vertices),'clips':[n for n,a in actions]}))

if __name__=='__main__':
    main(False)
    main(True)

