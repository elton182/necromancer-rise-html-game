"""Fallen King v4: ações recriadas a partir de poses-chave.

Abre models/boss_fallenKing_v3_teste.blend (modelo e espada ajustados), recria
idle, walk, windup, attack, recover, cast, death e o golpe saltado com as duas
mãos (slam_windup, slam, slam_recover) e salva em models/boss_fallenKing_v4.blend.
As cenas anteriores não são alteradas.

Pernas usam IK de duas articulações com o joelho alinhado sobre o pé; tronco
e braços são definidos em direções do espaço do peito; a espada é orientada
pela direção da lâmina. No golpe com as duas mãos, os braços seguem a pegada
por IK. Cada quadro é travado no chão e gravado para preservar o contato.

blender --background --python blender/scripts/animate_fallen_king_v4.py
"""
from pathlib import Path
import bpy, math, json
from mathutils import Vector, Matrix, Quaternion
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/boss_fallenKing_v3_teste.blend'))
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE')
sword=next(o for o in sc.objects if o.type=='MESH' and o.parent_type=='BONE' and o.parent_bone=='mixamorig:RightHand')
body=[o for o in sc.objects if o.type=='MESH' and o.parent==rig and o!=sword]
for o in sc.objects:
    if o.type=='MESH' and o.parent is None:o.hide_viewport=o.hide_render=True  # esfera de fundo

def vivid(material):
    """Realça a textura: saturação e contraste, e brilho ciano só nas runas e gemas."""
    nt=material.node_tree
    tex=next(n for n in nt.nodes if n.type=='TEX_IMAGE' and n.image.colorspace_settings.name=='sRGB')
    bsdf=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
    hue=nt.nodes.new('ShaderNodeHueSaturation');hue.inputs['Saturation'].default_value=1.28
    contrast=nt.nodes.new('ShaderNodeBrightContrast');contrast.inputs['Contrast'].default_value=.18
    nt.links.new(tex.outputs['Color'],hue.inputs['Color']);nt.links.new(hue.outputs['Color'],contrast.inputs['Color'])
    nt.links.new(contrast.outputs['Color'],bsdf.inputs['Base Color'])
    hsv=nt.nodes.new('ShaderNodeSeparateColor');hsv.mode='HSV'
    nt.links.new(tex.outputs['Color'],hsv.inputs['Color'])
    def remap(socket,low,high):
        node=nt.nodes.new('ShaderNodeMapRange');node.clamp=True
        node.inputs['From Min'].default_value=low;node.inputs['From Max'].default_value=high
        nt.links.new(socket,node.inputs['Value']);return node.outputs['Result']
    def math(operation,a,b=None):
        node=nt.nodes.new('ShaderNodeMath');node.operation=operation
        for i,value in enumerate((a,b)):
            if value is None:continue
            if isinstance(value,float):node.inputs[i].default_value=value
            else:nt.links.new(value,node.inputs[i])
        return node.outputs['Value']
    # Matiz próxima do ciano (0,5), saturada e clara: runas, gemas e olhos.
    distance=math('ABSOLUTE',math('SUBTRACT',hsv.outputs[0],.49))
    mask=math('MULTIPLY',math('MULTIPLY',remap(distance,.09,.03),remap(hsv.outputs[1],.30,.60)),remap(hsv.outputs[2],.35,.75))
    nt.links.new(contrast.outputs['Color'],bsdf.inputs['Emission Color'])
    nt.links.new(math('MULTIPLY',mask,2.2),bsdf.inputs['Emission Strength'])
for material in {s.material for o in sc.objects if o.type=='MESH' for s in o.material_slots if s.material and s.material.use_nodes}:
    vivid(material)
try:sc.view_settings.view_transform='Standard'  # AgX dessatura as cores fortes da textura
except TypeError as error:print('Transformação Standard indisponível:',error)
sc.view_settings.look='None'

def bone(name):return rig.pose.bones['mixamorig:'+name]
def update():bpy.context.view_layer.update()
def R(name):return bone(name).bone.matrix_local.to_3x3().to_quaternion()
def rx(a):return Quaternion((1,0,0),a)
def ry(a):return Quaternion((0,1,0),a)
def rz(a):return Quaternion((0,0,1),a)
def put(name,q):
    update();b=bone(name)
    b.matrix=Matrix.Translation(b.head.copy())@q.to_matrix().to_4x4()
def arc(name,direction):
    """Menor rotação que leva o eixo do osso em descanso para a direção dada."""
    return (R(name)@Vector((0,1,0))).rotation_difference(Vector(direction).normalized())
def lowest(objects):
    deps=bpy.context.evaluated_depsgraph_get()
    return min((e.matrix_world@v.co).z for o in objects for e in [o.evaluated_get(deps)] for v in e.data.vertices)
def two_bone(start,a,b,target,pole):
    """Articulação intermediária no plano do polo; devolve joelho/cotovelo, fim e excesso."""
    delta=target-start;distance=min(delta.length,a+b-1e-4)
    direction=delta.normalized()
    bend=(pole-direction*pole.dot(direction)).normalized()
    along=(a*a-b*b+distance*distance)/(2*distance)
    mid=start+direction*along+bend*math.sqrt(max(0,a*a-along*along))
    return mid,start+direction*distance,delta.length-distance

for b in rig.pose.bones:
    b.rotation_mode='QUATERNION';b.matrix_basis=Matrix.Identity(4)
update()
# Lâmina e pegada no espaço do osso da mão (eixo +Y local da espada).
BLADE=R('RightHand').inverted()@(sword.matrix_world.to_3x3()@Vector((0,1,0))).normalized()
REST_GROUND=lowest(body)
SECOND_HAND=.075  # distância entre os punhos ao longo do cabo

# Base estreita: tornozelos logo fora do quadril, joelhos alinhados por cima.
GUARD=dict(hip=(0,0,-.015),hyaw=0,hpitch=0,lean=.06,yaw=0,side=0,hdyaw=0,hdpitch=-.04,
           rU=(-.20,-.10,-1),rF=(.05,-1,.25),rB=(-.15,-.45,1),
           lU=(.22,-.05,-1),lF=(.06,-.45,-1),lH=(.02,-.30,-1),
           two=0,grip=(-.12,-.20,-.12),
           footL=(.095,-.06,.061),footR=(-.095,.03,.061),fyL=.15,fyR=-.20,fpL=0,fpR=0,knee=.45)
def P(**changes):return {**GUARD,**changes}

def apply(p,lift=0):
    for b in rig.pose.bones:b.matrix_basis=Matrix.Identity(4)
    update()
    hips=bone('Hips');hq=rz(p['hyaw'])@rx(p['hpitch'])
    offset=Vector(p['hip'])+Vector((0,0,lift))
    hips.matrix=Matrix.Translation(hips.bone.head_local+offset)@(hq@R('Hips')).to_matrix().to_4x4()
    chest=rz(p['yaw'])@ry(p['side'])@rx(p['lean'])
    for name,f in (('Spine',.35),('Spine1',.7),('Spine2',1)):put(name,hq.slerp(chest,f)@R(name))
    for name in ('LeftShoulder','RightShoulder'):put(name,chest@R(name))
    put('Neck',chest@rz(p['hdyaw']*.5)@rx(p['hdpitch']*.5)@R('Neck'))
    put('Head',chest@rz(p['hdyaw'])@rx(p['hdpitch'])@R('Head'))
    update()
    blade=(chest@Vector(p['rB'])).normalized()
    neck=bone('Neck').head.copy()
    reach=0
    def arm(side,upper,fore,target,pole):
        """Direções do braço: FK do peito misturada à IK da pegada por 'two'."""
        nonlocal reach
        dirs=[chest@Vector(upper).normalized(),chest@Vector(fore).normalized()]
        w=p['two']
        if w>0:
            update();start=bone(side+'Arm').head.copy()
            elbow,end,excess=two_bone(start,bone(side+'Arm').length,bone(side+'ForeArm').length,target,pole)
            if w>.99:reach=max(reach,excess)  # em transição a mão ainda está indo ao cabo
            dirs=[(d*(1-w)+ik*w).normalized() for d,ik in zip(dirs,((elbow-start).normalized(),(end-elbow).normalized()))]
        inverse=chest.inverted()
        put(side+'Arm',chest@arc(side+'Arm',inverse@dirs[0])@R(side+'Arm'))
        put(side+'ForeArm',chest@arc(side+'ForeArm',inverse@dirs[1])@R(side+'ForeArm'))
        return chest@arc(side+'ForeArm',inverse@dirs[1])
    grip=neck+chest@Vector(p['grip'])
    fore=arm('Right',p['rU'],p['rF'],grip,chest@Vector((-1,-.5,-.4)))
    hand=fore@R('RightHand')
    hand=(hand@BLADE).rotation_difference(blade)@hand
    put('RightHand',hand);update()
    wrist=bone('RightHand').head.copy()
    arm('Left',p['lU'],p['lF'],wrist-blade*SECOND_HAND,chest@Vector((1,-.5,-.4)))
    free=chest@arc('LeftHand',p['lH'])@R('LeftHand')
    # Segunda mão paralela à primeira, fechada no cabo.
    held=(R('LeftHand')@Vector((0,1,0))).rotation_difference(hand@Vector((0,1,0)))@R('LeftHand')
    put('LeftHand',free.slerp(held,p['two']))
    for side,sign in (('Left',1),('Right',-1)):
        update()
        # Polo à frente e para fora: o joelho fica sobre o pé, sem fechar a perna.
        pole=rz(p['hyaw'])@Vector((sign*p['knee'],-1,0)).normalized()
        start=bone(side+'UpLeg').head.copy()
        knee,end,excess=two_bone(start,bone(side+'UpLeg').length,bone(side+'Leg').length,
                                 Vector(p['foot'+side[0]])+Vector((0,0,lift if p.get('air') else 0)),pole)
        reach=max(reach,excess)
        put(side+'UpLeg',arc(side+'UpLeg',knee-start)@R(side+'UpLeg'))
        put(side+'Leg',arc(side+'Leg',end-knee)@R(side+'Leg'))
        put(side+'Foot',rz(p['fy'+side[0]])@rx(p['fp'+side[0]])@R(side+'Foot'))
    update()
    return reach

def pose(p):
    """Aplica a pose e sobe o quadril o necessário para nada atravessar o chão."""
    lift=0;reach=apply(p)
    for _ in range(4):
        floor=lowest(body)-REST_GROUND
        if p['two']>0:floor=min(floor,lowest([sword]))
        if floor>=-.002:break
        lift+=-floor+.001;reach=apply(p,lift)
    return reach,lift

EASE={'linear':lambda u:u,'smooth':lambda u:u*u*(3-2*u),
      'in':lambda u:u*u*u,'out':lambda u:1-(1-u)**3}
def mix(a,b,u):
    if isinstance(a,tuple):return tuple(x+(y-x)*u for x,y in zip(a,b))
    return a+(b-a)*u
def sample(keys,frame):
    """keys: (quadro, pose, curva até a próxima chave)."""
    for (f0,a,ease),(f1,b,_) in zip(keys,keys[1:]):
        if f0<=frame<=f1:
            u=EASE[ease]((frame-f0)/(f1-f0))
            out={k:mix(a[k],b[k],u) for k in a if k!='air'}
            out['air']=a.get('air') and b.get('air')
            return out
    return keys[-1][1]

# Poses compartilhadas garantem continuidade entre preparação, golpe e recuperação.
COIL=P(hip=(0,.03,-.04),hyaw=-.15,lean=-.05,yaw=-.55,side=.05,hdyaw=.45,hdpitch=-.02,
       rU=(-.75,.2,.65),rF=(.2,.45,1),rB=(.15,.75,.65),
       lU=(.35,-.6,-.6),lF=(.2,-1,-.2),lH=(.1,-1,0))
CONTACT=P(hip=(0,-.06,-.07),hyaw=.2,lean=.35,yaw=.35,side=-.05,hdyaw=-.3,hdpitch=-.28,
          rU=(-.1,-1,-.15),rF=(.25,-1,-.3),rB=(.35,-1,-.7),
          lU=(.3,.35,-.9),lF=(.1,.2,-1),lH=(.1,0,-1))
FOLLOW=P(hip=(0,-.07,-.075),hyaw=.3,lean=.4,yaw=.65,side=-.06,hdyaw=-.55,hdpitch=-.3,
         rU=(.35,-.75,-.55),rF=(.85,-.45,-.3),rB=(1,-.05,-.6),
         lU=(.3,.4,-.85),lF=(.1,.3,-1),lH=(.1,.1,-1))
BREATH=P(hip=(0,0,-.02),lean=.08,hdpitch=-.06,rU=(-.21,-.09,-1),rB=(-.14,-.42,1),lF=(.06,-.42,-1))
GATHER=P(hip=(0,.01,-.035),lean=-.08,yaw=-.15,hdyaw=.15,
         rU=(-.25,.05,-1),rF=(-.1,-.3,-1),rB=(-.4,-.55,-.45),
         lU=(.3,-.3,-.8),lF=(-.6,-.7,.35),lH=(-.5,-.6,.6))
RELEASE=P(hip=(0,-.02,-.03),lean=.12,yaw=.15,hdyaw=-.15,hdpitch=-.12,
          rU=(-.25,.05,-1),rF=(-.1,-.3,-1),rB=(-.4,-.55,-.45),
          lU=(.15,-1,.25),lF=(.05,-1,.3),lH=(0,-1,.55))
KNEEL=dict(footL=(.095,.17,.07),footR=(-.095,.19,.07),fpL=-1.2,fpR=-1.2,knee=.2)
# Golpe saltado: pegada (grip) relativa ao pescoço, no espaço do peito.
GRAB=P(two=1,hip=(0,.01,-.04),lean=.12,yaw=-.12,hdyaw=.12,hdpitch=-.1,
       grip=(-.02,-.17,-.10),rB=(-.08,-.35,1))
LOAD=P(two=1,hip=(0,.03,-.11),hpitch=.12,lean=.32,yaw=-.28,side=.04,hdyaw=.28,hdpitch=-.38,
       grip=(-.12,-.06,.03),rB=(-.25,.65,.7))
TAKEOFF=P(two=1,air=True,hip=(0,-.01,.03),lean=.08,yaw=-.15,hdyaw=.15,hdpitch=-.12,
          grip=(-.04,-.08,.10),rB=(-.1,.35,1),
          footL=(.095,-.05,.09),footR=(-.095,.05,.085),fpL=.2,fpR=.25)
APEX=P(two=1,air=True,hip=(0,-.03,.17),hpitch=-.08,lean=-.14,yaw=0,hdpitch=.05,
       grip=(-.01,-.03,.17),rB=(0,.8,.55),
       footL=(.095,.01,.29),footR=(-.095,.07,.25),fpL=.45,fpR=.5)
STRIKE=P(two=1,air=True,hip=(0,-.05,.06),hpitch=.1,lean=.38,hdpitch=-.3,
         grip=(-.01,-.21,-.04),rB=(0,-1,.15),
         footL=(.095,-.07,.13),footR=(-.095,.04,.12),fpL=.2,fpR=.25)
IMPACT=P(two=1,hip=(0,-.05,-.14),hpitch=.22,lean=.6,hdpitch=-.55,
         grip=(-.02,-.21,-.10),rB=(0,-1,-.03))
SETTLE=P(**{**IMPACT,'hip':(0,-.05,-.15),'lean':.61,'rB':(0,-1,0)})
PULL=P(two=1,hip=(0,-.02,-.06),hpitch=.08,lean=.22,hdpitch=-.22,
       grip=(-.03,-.18,-.10),rB=(-.08,-.4,1))
ACTIONS={
    'idle':(True,[(1,GUARD,'smooth'),(25,BREATH,'smooth'),(49,GUARD,'smooth')]),
    'windup':(False,[(1,GUARD,'smooth'),(18,COIL,'smooth')]),
    'attack':(False,[(1,COIL,'in'),(5,CONTACT,'out'),(9,FOLLOW,'smooth'),(14,FOLLOW,'smooth')]),
    'recover':(False,[(1,FOLLOW,'smooth'),(18,GUARD,'smooth')]),
    'cast':(False,[(1,GUARD,'smooth'),(10,GATHER,'in'),(17,RELEASE,'out'),
                   (28,P(**{**RELEASE,'lean':.10,'lH':(0,-1,.45)}),'smooth'),(36,GUARD,'smooth')]),
    'death':(False,[(1,GUARD,'out'),
        (5,P(hip=(0,.04,-.01),lean=-.3,side=.1,hdpitch=-.35,
             rU=(-.7,.1,-.4),rF=(-1,.1,-.2),rB=(-.6,.5,.6),
             lU=(.8,.2,-.3),lF=(1,0,-.1),lH=(1,0,0)),'in'),
        (14,P(hip=(0,-.02,-.16),hpitch=.2,lean=.25,side=-.05,hdpitch=.3,
              rU=(-.3,-.2,-1),rF=(-.1,-.6,-1),rB=(-.3,-.95,.05),
              lU=(.25,-.2,-1),lF=(.1,-.5,-1),lH=(0,-.3,-1),**KNEEL),'smooth'),
        (22,P(hip=(0,-.03,-.17),hpitch=.25,lean=.45,side=-.05,hdpitch=.5,
              rU=(-.3,-.2,-1),rF=(-.1,-.5,-1),rB=(-.3,-.95,.05),
              lU=(.25,-.2,-1),lF=(.1,-.45,-1),lH=(0,-.3,-1),**KNEEL),'in'),
        (34,P(hip=(0,-.20,-.33),hpitch=1.35,lean=1.5,hdyaw=.5,hdpitch=.1,
              rU=(-1,0,.2),rF=(-1,-.2,.3),rB=(-1,-.35,.3),
              lU=(1,0,.25),lF=(1,-.2,.35),lH=(1,-.3,.2),**KNEEL),'out'),
        (40,P(hip=(0,-.20,-.335),hpitch=1.38,lean=1.52,hdyaw=.5,hdpitch=.12,
              rU=(-1,0,.2),rF=(-1,-.2,.3),rB=(-1,-.35,.3),
              lU=(1,0,.25),lF=(1,-.2,.35),lH=(1,-.3,.2),**KNEEL),'smooth')]),
    # Preparação legível: agarra com as duas mãos e agacha com a espada no ombro.
    'slam_windup':(False,[(1,GUARD,'smooth'),(8,GRAB,'smooth'),(18,LOAD,'smooth')]),
    # Salto, ápice com a lâmina atrás da cabeça, descida e impacto no chão (quadro 14).
    'slam':(False,[(1,LOAD,'out'),(4,TAKEOFF,'out'),(8,APEX,'in'),(12,STRIKE,'linear'),
                   (14,IMPACT,'out'),(18,SETTLE,'smooth')]),
    'slam_recover':(False,[(1,SETTLE,'smooth'),(10,PULL,'smooth'),(22,GUARD,'smooth')]),
}
IMPACT_FRAME={'attack':5,'slam':14}
# A espada deita de lado antes da queda, sem arrastar pelo chão.
FALL=sample(ACTIONS['death'][1],27);FALL['rB']=(-1,-.35,.3)
ACTIONS['death'][1].insert(4,(27,FALL,'in'))

def walk_pose(t):
    """Caminhada pesada: tornozelos seguem a trajetória validada no estudo de walk."""
    swing=math.sin(math.tau*t);p=dict(GUARD)
    p.update(hip=(.009*swing,0,-.028+.007*math.cos(2*math.tau*t)),hyaw=-.08*swing,
             lean=.09,yaw=.07*swing,hdyaw=-.07*swing,
             lU=(.22,.23*swing,-1),lF=(.04,-.24+.23*swing,-1),lH=(.05,-.25,-1),
             rU=(-.22,-.06-.05*swing,-1),rB=(-.15,-.4,1),fyL=.08,fyR=-.08)
    for side,sign,offset in (('L',1,0),('R',-1,.5)):
        phase=(t+offset)%1
        if phase<.6:y=-.095+.19*(phase/.6);lift=0;pitch=0
        else:
            u=(phase-.6)/.4;s=u*u*(3-2*u)
            y=.095-.19*s;lift=.065*math.sin(math.pi*u)**1.3;pitch=.35*math.sin(math.pi*u)
        p['foot'+side]=(sign*.10,y-.035,.061+lift);p['fp'+side]=pitch
    return p

rig.animation_data_create()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
report={}
STANDING=('idle','walk','windup','attack','recover','cast')
for name in ('idle','walk','windup','attack','recover','cast','death','slam_windup','slam','slam_recover'):
    action=bpy.data.actions.new(name);action.use_fake_user=True
    rig.animation_data.action=action
    if name=='walk':loop,frames=True,32
    else:
        loop,keys=ACTIONS[name];frames=keys[-1][0]-(1 if loop else 0)
    previous={};reach=0;lifted=0;knee_out=0;feet=[]
    for frame in list(range(1,frames+1))+([frames+1] if loop else []):
        sc.frame_set(frame)
        # O quadro extra do ciclo repete o primeiro e fecha o loop sem salto.
        f=1 if frame>frames else frame
        p=walk_pose((f-1)/frames) if name=='walk' else sample(keys,f)
        r,lift=pose(p);reach=max(reach,r);lifted=max(lifted,lift)
        feet.append([bone(s+'Foot').head.copy() for s in ('Left','Right')])
        if name in STANDING:
            for s in ('Left','Right'):knee_out=max(knee_out,abs(bone(s+'Foot').head.x)-abs(bone(s+'Leg').head.x))
        for b in rig.pose.bones:
            if b.name in previous and b.rotation_quaternion.dot(previous[b.name])<0:b.rotation_quaternion.negate()
            previous[b.name]=b.rotation_quaternion.copy()
            b.keyframe_insert('rotation_quaternion',frame=frame);b.keyframe_insert('location',frame=frame)
    action['frames']=frames;action['loop']=loop;action['fps']=24
    if name in IMPACT_FRAME:action['impactFrame']=IMPACT_FRAME[name]
    # Conferência pelo resultado gravado: chão, espada e pés plantados.
    ground=[];blade=[]
    for frame in range(1,frames+1):
        sc.frame_set(frame);ground.append(lowest(body)-REST_GROUND);blade.append(lowest([sword]))
    planted=name in STANDING and name!='walk' or name=='slam_recover'
    slip=max((f[i]-feet[0][i]).length for f in feet for i in (0,1)) if planted else 0
    report[name]=dict(frames=frames,fps=24,loop=loop,footSlip=round(slip,4),legOrArmOverreach=round(reach,4),
                      groundLift=round(lifted,4),footOutsideKnee=round(knee_out,4),
                      bodyLowest=round(min(ground),4),swordLowest=round(min(blade),4))
    if name in IMPACT_FRAME:
        report[name]['impactFrame']=IMPACT_FRAME[name]
        report[name]['swordAtImpact']=round(blade[IMPACT_FRAME[name]-1],4)
rig.animation_data.action=bpy.data.actions['idle'];rig.animation_data.action_slot=bpy.data.actions['idle'].slots[0]
sc.render.fps=24;sc.frame_start=1;sc.frame_end=48;sc.frame_set(1)
report['source']='models/boss_fallenKing_v3_teste.blend'
report['status']='Ações recriadas e conferidas no Blender; render de sprites e integração ao jogo pendentes.'
(BASE/'previews/fallen_king_v4_validation.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/boss_fallenKing_v4.blend'))
print(json.dumps(report,indent=2,ensure_ascii=False))
