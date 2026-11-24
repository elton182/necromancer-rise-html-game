"""Rig e movimentos do novo mago T; preserva o gerador e o asset anteriores.

Blender: --background --python blender/scripts/mage_hero_t.py -- --blocking
Depois da revisão: execute sem --blocking. Usa a fonte T preservada e o cajado antigo.
"""
import sys as _asset_sys
from pathlib import Path as _AssetPath
_asset_sys.path.insert(0, str(_AssetPath(__file__).resolve().parent))
from asset_paths import asset_path

from pathlib import Path
import ast
import math
import sys
import json
import bpy
import bmesh
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import common
from mage_hero_gait import MageGait, STRIDE, STRAFE_STRIDE
from mage_hero_grip import repair_shaft
from mage_hero_fingers import add_finger_bones, weight_fingers, pose_grip

BLOCKING = '--blocking' in sys.argv
FPS = 30
CLIPS = [('idle', 121), ('walk', 25), ('strafe_left', 25), ('strafe_right', 25),
         ('cast', 16), ('cast_up', 22), ('dodge', 16), ('death', 31)]
scene = bpy.context.scene
# Load only the source mesh; never clear the user's scene.
for obj in list(scene.objects):
    if obj.get('mage_t_generated'):
        bpy.data.objects.remove(obj, do_unlink=True)
for action in list(bpy.data.actions):
    if action.get('mage_t_generated'):
        action.use_fake_user = False
        if action.users == 0:
            bpy.data.actions.remove(action)
for obj in scene.objects:
    obj.hide_set(True)
    obj.hide_render = True
source_path = Path(asset_path(ROOT / 'models/mage_hero_t_source.blend'))
if Path(bpy.data.filepath).resolve() == source_path.resolve():
    source = next(o for o in scene.objects if o.name.startswith('tripo_node_'))
    mesh = source.copy()
    mesh.data = source.data.copy()
else:
    with bpy.data.libraries.load(asset_path(str(source_path))) as (src, dst):
        dst.objects = [n for n in src.objects if n.startswith('tripo_node_')]
    mesh = dst.objects[0]
scene.collection.objects.link(mesh)
mesh.name = 'MageTBody'
mesh.hide_set(False)
mesh.hide_render = False
mesh['mage_t_generated'] = True
for v in mesh.data.vertices:
    v.co = mesh.matrix_world @ v.co
mesh.matrix_world = Matrix.Identity(4)

# Rig mínimo com IDs Mixamo para as camadas de tronco/pernas do jogo.
common.BONES = {}
def bone(n, h, t, p=None):
    common.bone('mixamorig:' + n, h, t, 'mixamorig:' + p if p else None)

bone('Root', (0, 0, 0), (0, 0, .06))
bone('Hips', (0, .025, .43), (0, .025, .49), 'Root')
bone('Spine', (0, .025, .49), (0, .025, .55), 'Hips')
bone('Spine1', (0, .025, .55), (0, .025, .60), 'Spine')
bone('Spine2', (0, .025, .60), (0, .025, .67), 'Spine1')
bone('Neck', (0, .025, .67), (0, .015, .715), 'Spine2')
bone('Head', (0, .015, .715), (0, .015, .84), 'Neck')
bone('HeadBeard', (0, -.09, .685), (0, -.11, .545), 'Head')
bone('HeadHatTip', (0, .015, .84), (-.045, .015, .96), 'Head')
for side, s in [('Left', 1), ('Right', -1)]:
    bone(side+'Shoulder', (s*.045, .025, .64), (s*.15, .025, .64), 'Spine2')
    bone(side+'Arm', (s*.15, .025, .64), (s*.275, .025, .63), side+'Shoulder')
    bone(side+'ForeArm', (s*.275, .025, .63), (s*.37, .025, .63), side+'Arm')
    bone(side+'Hand', (s*.37, .025, .63), (s*.43, .025, .63), side+'ForeArm')
    bone(side+'HandFingers', (s*.43, .025, .63), (s*.478, .025, .63), side+'Hand')
    bone(side+'UpLeg', (s*.085, .025, .42), (s*.091, .014, .23), 'Hips')
    bone(side+'Leg', (s*.091, .014, .23), (s*.105, .025, .07), side+'UpLeg')
    bone(side+'Foot', (s*.105, .025, .07), (s*.105, -.07, .035), side+'Leg')
    bone(side+'ToeBase', (s*.105, -.07, .035), (s*.105, -.12, .03), side+'Foot')
    bone(side+'Robe', (s*.07, .035, .42), (s*.13, .035, .17), 'Hips')
add_finger_bones(bone)
rig = common.build_rig()
rig.name = 'ARM_MageT'
rig['mage_t_generated'] = True
rig.show_in_front = True
for b in rig.pose.bones:
    b.rotation_mode = 'QUATERNION'
bones = {b.name.split(':')[-1]: b for b in rig.pose.bones}
def rest(name):
    return bones[name].bone.head_local.copy()
def smooth(t):
    t = max(0, min(1, t))
    return t*t*(3-2*t)
def mix(a, b, t):
    return {a: 1-t, b: t}

# Pesos por região: chapéu e barba não acompanham braços; botas não puxam manto.
groups = {n: mesh.vertex_groups.new(name='mixamorig:'+n) for n in bones}
for v in mesh.data.vertices:
    x,y,z = v.co
    ax = abs(x)
    side = 'Left' if x > 0 else 'Right'
    if z > .76 or z > .705 and ax < .20:
        w = mix('Head', 'HeadHatTip', .25*smooth((z-.87)/.1))
    elif y < -.075 and .53 < z < .72 and ax < .067:
        w = mix('Head', 'HeadBeard', .8*smooth((.70-z)/.14))
    elif ax > .17 and z > .53:
        if ax > .40:
            w = mix(side+'Hand', side+'HandFingers', smooth((ax-.425)/.028))
        elif ax > .31:
            w = mix(side+'ForeArm', side+'Hand', smooth((ax-.34)/.055))
        else:
            w = mix(side+'Arm', side+'ForeArm', smooth((ax-.25)/.06))
    elif z > .51:
        if ax > .115 and z > .59:
            w = mix('Spine2', side+'Arm', smooth((ax-.115)/.08))
        else:
            w = mix('Spine', 'Spine2', smooth((z-.52)/.1))
    elif z > .40:
        w = mix('Hips', 'Spine', smooth((z-.46)/.07))
    elif z > .14:
        # Manto independente, balanço moderado; não estica com as canelas.
        w = mix('Hips', side+'Robe', .75*smooth((.42-z)/.22))
    else:
        w = mix(side+'Leg', side+'Foot', 1-smooth((z-.065)/.07))
    for n, weight in w.items():
        if weight > .00001: groups[n].add([v.index], weight, 'REPLACE')
# Biqueira articulada: a ponta acompanha o apoio enquanto o calcanhar levanta.
for v in mesh.data.vertices:
    if v.co.z<.055 and v.co.y<-.065:
        side='Left' if v.co.x>0 else 'Right'
        amount=.85*smooth((-.065-v.co.y)/.055)
        for ge in list(v.groups):mesh.vertex_groups[ge.group].remove([v.index])
        groups[side+'Foot'].add([v.index],1-amount,'REPLACE')
        groups[side+'ToeBase'].add([v.index],amount,'REPLACE')
weight_fingers(mesh,groups)
mod = mesh.modifiers.new('MageT skin', 'ARMATURE')
mod.object = rig
mesh.parent = rig

# Recupera exclusivamente o cajado da malha antiga, com UV e material originais.
with bpy.data.libraries.load(asset_path(str(ROOT / 'models/mage_hero.blend'))) as (src, dst):
    dst.objects = ['MageBody']
old = dst.objects[0]
staff = bpy.data.objects.new('MageTStaff', old.data.copy())
scene.collection.objects.link(staff)
staff['mage_t_generated'] = True
shaft = [v.co.copy() for v in staff.data.vertices if v.co.x < -.12 and v.co.y < -.035 and v.co.z < .3]
mean = sum(shaft, Vector()) / len(shaft)
den = sum((v.z-mean.z)**2 for v in shaft)
kx = sum((v.z-mean.z)*(v.x-mean.x) for v in shaft)/den
ky = sum((v.z-mean.z)*(v.y-mean.y) for v in shaft)/den
def axis(z):
    return Vector((mean.x+kx*(z-mean.z), mean.y+ky*(z-mean.z), z))
bm = bmesh.new()
bm.from_mesh(staff.data)
discard=[]
for v in bm.verts:
    a=axis(v.co.z)
    d=math.hypot(v.co.x-a.x, v.co.y-a.y)
    if not (d < (.095 if v.co.z > .62 else .027) and v.co.x < -.12):
        discard.append(v)
bmesh.ops.delete(bm, geom=discard, context='VERTS')
bm.to_mesh(staff.data)
bm.free()
repair_shaft(staff,axis)
staff.vertex_groups.clear()
# Endireita o eixo antigo e posiciona a haste no centro da pegada.
# Compensa no bind a meia-volta da pegada, mantendo a haste no lugar.
grip = Vector((-.433, .020, .607))
oldgrip = axis(.489)
q = Vector((kx,ky,1)).rotation_difference(Vector((0,0,1)))
bind_staff = Quaternion(Vector((1,0,0)), math.pi/2)
for v in staff.data.vertices:
    v.co = bind_staff @ (q @ (v.co-oldgrip)) * .90 + grip
g = staff.vertex_groups.new(name='mixamorig:RightHand')
g.add(list(range(len(staff.data.vertices))),1,'REPLACE')
mod = staff.modifiers.new('Staff rigid grip','ARMATURE')
mod.object = rig
staff.parent = rig
bpy.data.objects.remove(old, do_unlink=True)

# Reutiliza as funções de IK analítico e direção do gerador anterior, sem executá-lo.
tree = ast.parse((ROOT/'scripts/mage_hero.py').read_text(encoding='utf8'))
keep = {'ease','rot_world','aim_bones','arm','leg','gait','staff_q','pose','apply'}
functions = ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in keep], type_ignores=[])
lerp = lambda a,b,t: a+(b-a)*t
HIP, HEAD = rest('Hips'), rest('Head')
CX, CY = HIP.x, HIP.y
FOOT = {s:rest(s+'Foot') for s in ('Left','Right')}
SH = {s:rest(s+'Arm') for s in ('Left','Right')}
# Destinos de combate; o bind continua em T.
HAND = {'Right':Vector((-.19,-.12,.49)), 'Left':Vector((.23,-.07,.47))}
# Palma vertical com polegar para cima, em todos os clipes que usam staff_q.
H0 = Quaternion(Vector((0,1,0)), math.pi) @ Quaternion(Vector((1,1,1)).normalized(), math.tau/3) @ bones['RightHand'].bone.matrix_local.to_quaternion()
exec(compile(functions,'mage_hero_motion_reuse','exec'),globals())
base_arm=arm

def arm(side,target,pole,hand_q=None):
    base_arm(side,target,pole,hand_q)
    if side!='Right' or hand_q is None:
        return
    # Pronação acompanha a palma no antebraço; evita torcer só a junção do punho.
    fore=bones['RightForeArm']
    hand=bones['RightHand']
    hand_matrix=hand.matrix.copy()
    axis=(fore.tail-fore.head).normalized()
    current=fore.matrix.to_quaternion() @ Vector((0,0,1))
    desired=hand_q @ Vector((0,0,1))
    current=(current-axis*current.dot(axis)).normalized()
    desired=(desired-axis*desired.dot(axis)).normalized()
    angle=math.atan2(axis.dot(current.cross(desired)),current.dot(desired))
    fore.matrix=Matrix.LocRotScale(fore.head.copy(),Quaternion(axis,angle) @ fore.matrix.to_quaternion(),Vector((1,1,1)))
    bpy.context.view_layer.update()
    hand.matrix=hand_matrix
    bpy.context.view_layer.update()
    pose_grip(rig)

old_pose = pose
# Quadro de impacto (fração do clipe) lido pelo runtime em models.json → impact.
CAST_IMPACT = 7/15      # frame 8 de 16: soltura da Seta, Bola de Fogo, Rajada etc.
CAST_UP_IMPACT = 14/21  # frame 15 de 22: cajado aponta o chão (Meteoro, evocações)
def pose(name,t):
    base=old_pose('idle',t)
    p=old_pose(name,t)
    if name=='cast':
        # Preparação legível: ergue e puxa o cajado para trás, junto ao corpo, com o cristal
        # inclinado para trás; no disparo (frame 8) a extensão é máxima; depois recua (coice).
        up=ease([(0,0),(.20,1),(.62,1),(1,0)],t)
        draw=ease([(0,0),(.22,1),(.30,1),(CAST_IMPACT,0),(1,0)],t)
        push=ease([(0,0),(.30,0),(CAST_IMPACT,1),(.62,.55),(1,0)],t)
        kick=ease([(0,0),(CAST_IMPACT,0),(.56,1),(.76,0),(1,0)],t)
        p['right']=lerp(base['right'],SH['Right']+Vector((-.02,-.150-.050*push+.030*kick+.120*draw,-.06+.070*draw)),up)
        p['staff']=staff_q(.05+1.05*up-.75*draw-.10*kick)
        p['left']=lerp(base['left'],SH['Left']+Vector((-.03,-.155-.040*push+.060*draw,-.075)),up)
        p['twist']=.15*up-.22*draw-.04*kick
        p['lean']=.05+.08*push-.05*draw
        p['hip'].x+=-.012*draw-.006*kick
    elif name=='cast_up':
        # Ergue, sustenta e desce em cerca de cinco quadros até apontar o chão no impacto;
        # a recuperação sai direto da pose apontada, sem passar de novo pelo alto.
        up=ease([(0,0),(.35,1),(.44,1),(CAST_UP_IMPACT,0),(1,0)],t)
        slam=ease([(0,0),(.44,0),(CAST_UP_IMPACT,1),(.80,1),(1,0)],t)
        p['right']=lerp(base['right'],Vector((SH['Right'].x+.02,CY-.06,HEAD.z+.06)),up)
        # No impacto braço e cajado se projetam à frente e para fora, com o cristal apontando o
        # chão além da barra do manto (≈15° abaixo da horizontal), legível de cima.
        p['right']=lerp(p['right'],SH['Right']+Vector((-.05,-.175,-.09)),slam)
        p['staff']=staff_q(.05-.15*up+1.85*slam)
        p['left']=lerp(base['left'],Vector((SH['Left'].x-.02,CY-.05,HEAD.z+.02)),up*(1-slam))
        p['lean']=.05-.12*up+.2*slam
        p['head']=-.25*up+.2*slam
    elif name=='death':
        # Braço livre solto na queda, sem cotovelo travado.
        p['left']=p['left']+Vector((-.015,.01,.015))
        # Coluna acompanha a queda de costas, sem dobrar o tronco para cima do chão.
        p['lean']=.05-.12*p['death']
    elif name=='dodge':
        # Esquiva legível de cima: corpo baixo e projetado na direção do movimento (o modelo
        # gira para a direção da esquiva), com passada aberta e cajado recolhido.
        crouch=ease([(0,0),(.22,1),(.68,1),(1,0)],t)
        p['hip'].z=-.02-.11*crouch
        p['hip'].y=-.04*crouch
        p['lean']=.05+.95*crouch
        p['feet']['Left']=Vector((.03,-.13*crouch,0))
        p['feet']['Right']=Vector((-.03,.11*crouch,.0))
    return p
old_apply = apply
human_gait=MageGait(rig,mesh,staff,rot_world,arm,leg,staff_q,STRIDE,STRAFE_STRIDE)
def apply_idle(t):
    """Repouso assimétrico: apoio fixo, braço solto e respiração de quatro segundos."""
    phase=t*math.tau
    breath=math.sin(phase)
    lag=math.sin(phase-.4)
    for b in rig.pose.bones:
        b.rotation_quaternion=(1,0,0,0)
        b.location=(0,0,0)
    rot_world('Hips',(.008,-.025+.006*lag,-.035))
    rot_world('Spine',(.022,.014,-.012+.008*breath))
    rot_world('Spine1',(.018+.009*breath,.010,.022))
    rot_world('Spine2',(.014+.010*breath,.006,.025+.006*lag))
    rot_world('Neck',(-.018,0,-.012))
    rot_world('Head',(-.023-.009*lag,-.014,-.020-.008*lag))
    rot_world('LeftShoulder',(.006*lag,-.018,.010))
    rot_world('RightShoulder',(-.006*lag,.012,-.010))
    bpy.context.view_layer.update()
    hips=bones['Hips']
    matrix=hips.matrix.copy()
    matrix.translation+=Vector((-.012+.003*lag,.002*lag,-.035+.0025*breath))
    hips.matrix=matrix
    bpy.context.view_layer.update()
    for side in ('Left','Right'):
        target=FOOT[side]+Vector((.01 if side=='Left' else -.01,-.02 if side=='Left' else .03,0))
        leg(side,target,target+Vector((0,-.25,.3)))
    # Cotovelo livre aponta para baixo, em vez de abrir como o de conjuração.
    left=Vector((.182+.002*lag,-.016+.003*lag,.430+.003*breath))
    right=Vector((-.205,-.110+.002*lag,.515+.002*breath))
    arm('Left',left,bones['LeftArm'].head+Vector((.025,.085,-.22)))
    arm('Right',right,right+Vector((-.16,.12,-.07)),staff_q(.12+.008*lag,-.025))
    rot_world('LeftHandFingers',(0,.16,0))
    rot_world('LeftRobe',(.005*math.sin(phase-.65),.003*lag,0))
    rot_world('RightRobe',(.004*math.sin(phase-.8),-.003*lag,0))

# Extremos ao longo do maior eixo da haste no bind (ela não está em pé no espaço da malha).
_LONG=max(range(3),key=lambda k:max(v.co[k] for v in staff.data.vertices)-min(v.co[k] for v in staff.data.vertices))
STAFF_TOP=max(range(len(staff.data.vertices)),key=lambda i:staff.data.vertices[i].co[_LONG])
STAFF_BOTTOM=min(range(len(staff.data.vertices)),key=lambda i:staff.data.vertices[i].co[_LONG])
def staff_ends(all_points=False):
    bpy.context.view_layer.update()
    ev=staff.evaluated_get(bpy.context.evaluated_depsgraph_get())
    if all_points:return [staff.matrix_world@v.co for v in ev.data.vertices]
    return [staff.matrix_world@ev.data.vertices[i].co for i in (STAFF_BOTTOM,STAFF_TOP)]

# Fração inicial e início do retorno em que cada clipe se funde com o idle.
EDGES={'cast':(.25,.75),'cast_up':(.25,.82),'dodge':(.18,.75),'death':(.30,None)}
_IDLE=None
def idle_pose():
    global _IDLE
    if _IDLE is None:
        apply('idle',0)
        _IDLE={b.name:(b.rotation_quaternion.copy(),b.location.copy()) for b in rig.pose.bones}
    return _IDLE

def apply(name,t):
    if name in ('walk','strafe_left','strafe_right'):
        human_gait.apply(name,t)
        return
    if name=='idle':
        apply_idle(t)
    else:
        old_apply(name,t)
    # Pés imóveis durante conjurações; transferência no quadril, sem passos deslizando.
    if name in ('cast','cast_up'):
        for side in ('Left','Right'):
            target=FOOT[side]+Vector((.01 if side=='Left' else -.01,-.02 if side=='Left' else .03,0))
            leg(side,target,target+Vector((0,-.25,.3)))
    energy = math.sin(t*math.tau)
    rot_world('HeadBeard',((.010 if name=='idle' else .025)*math.sin(t*math.tau-.4),0,0))
    rot_world('HeadHatTip',((.012 if name=='idle' else .025)*math.sin(t*math.tau-.7),0,(.008 if name=='idle' else .018)*energy))
    # Fecha a mão direita em torno da haste; polegar permanece na palma.
    rot_world('RightHandFingers',(0,-1.45,0))
    edge=EDGES.get(name)
    if edge:
        # Começo e fim iguais ao frame 1 do idle: sem salto ao entrar ou sair do clipe.
        start,end=edge
        e=1-smooth(t/start) if t<start else smooth((t-end)/(1-end)) if end and t>end else 0
        if e>0:
            idle=idle_pose()
            for b in rig.pose.bones:
                q,loc=idle[b.name]
                if b.rotation_quaternion.dot(q)<0:q=-q
                b.rotation_quaternion=b.rotation_quaternion.slerp(q,e)
                b.location=b.location.lerp(loc,e)
            bpy.context.view_layer.update()
            if name in ('cast','cast_up'):
                for side in ('Left','Right'):
                    target=FOOT[side]+Vector((.01 if side=='Left' else -.01,-.02 if side=='Left' else .03,0))
                    leg(side,target,target+Vector((0,-.25,.3)))
    if name=='death':
        # Deita de costas: quadril desce até o chão e as pernas se estendem à frente,
        # joelhos para cima, em vez de o corpo ficar suspenso pelas pontas das botas.
        fall=ease([(0,0),(.55,1),(1,1)],t)
        if fall>0:
            bpy.context.view_layer.update()
            hips=bones['Hips']
            matrix=hips.matrix.copy()
            matrix.translation.z=lerp(matrix.translation.z,.085,fall)
            hips.matrix=matrix
            bpy.context.view_layer.update()
            base=hips.head.copy()
            for side,s in (('Left',1),('Right',-1)):
                stand=FOOT[side]+Vector((0,-.1*fall,0))
                flat=Vector((s*.11,base.y-.30,.055))
                target=stand.lerp(flat,smooth(fall))
                # Joelhos cedem para a frente no desequilíbrio e apontam para cima já deitado.
                bend=Vector((0,-.30,.25)).lerp(Vector((0,.05,.35)),smooth(fall))
                leg(side,target,target+bend)
                # Deitado, a biqueira aponta para cima e o apoio passa ao calcanhar.
                foot=bones[side+'Foot']
                q=Euler((-1.35*smooth(fall),0,s*.18*fall)).to_quaternion()@foot.bone.matrix_local.to_quaternion()
                foot.matrix=Matrix.LocRotScale(foot.head.copy(),q,Vector((1,1,1)))
                bpy.context.view_layer.update()
                # A saia acompanha a coxa ao deitar; rígida no quadril, ela escorava o corpo no ar.
                thigh=bones[side+'UpLeg'];robe=bones[side+'Robe']
                turn=thigh.matrix.to_quaternion()@thigh.bone.matrix_local.to_quaternion().inverted()
                rest_q=robe.matrix.to_quaternion()
                follow=rest_q.slerp(turn@robe.bone.matrix_local.to_quaternion(),smooth(fall))
                robe.matrix=Matrix.LocRotScale(robe.head.copy(),follow,Vector((1,1,1)))
                bpy.context.view_layer.update()
            # O braço do cajado cai ao lado do corpo e o cajado deita no chão, sem ficar erguido no ar.
            drop=ease([(0,0),(.12,0),(.62,1),(1,1)],t)
            if drop>0:
                hand=bones['RightHand']
                start_q=hand.matrix.to_quaternion()
                target=hand.head.lerp(Vector((-.25,base.y+.09,.06)),drop)
                hand_q=start_q
                for iteration in range(3):
                    # Alcance confortável: no máximo 0,205 do ombro (braço de 0,22), sem cotovelo travado.
                    shoulder=bones['RightArm'].head
                    if (target-shoulder).length>.205:target=shoulder+(target-shoulder).normalized()*.205
                    arm('Right',target,target+Vector((-.15,-.05,.25)),hand_q)
                    # Cabeça do cajado para o lado dos pés, deitada e um pouco aberta;
                    # reavalia o eixo depois do IK, que reorienta o punho.
                    ends=staff_ends()
                    axis=(ends[1]-ends[0]).normalized()
                    want=axis.slerp(Vector((-.30,-1,0)).normalized(),drop) if axis.dot(Vector((-.30,-1,0)))>-.99 else Vector((-.30,-1,0)).normalized()
                    hand_q=axis.rotation_difference(want)@bones['RightHand'].matrix.to_quaternion()
                    arm('Right',target,target+Vector((-.15,-.05,.25)),hand_q)
                    low=min(v.z for v in staff_ends(all_points=True))
                    # Limitado ao alcance confortável: sem esticar o cotovelo até travar.
                    target.z=max(.035,base.z-.05,target.z-(low-.004)*drop)
    if name in ('death','dodge'):
        bpy.context.view_layer.update()
        dg=bpy.context.evaluated_depsgraph_get()
        low=min(v.co.z for o in (mesh,staff) for v in o.evaluated_get(dg).data.vertices)
        # Esquiva só sobe se atravessar o piso; na morte o ponto mais baixo encosta no chão.
        if low < 0 or name=='death' and low>1e-4:
            hips=bones['Hips']
            matrix=hips.matrix.copy()
            matrix.translation.z -= low
            hips.matrix=matrix

scene.render.fps=FPS
scene.frame_set(1)
idle_pose()
rig.animation_data_create()
actions={}
for name,end in CLIPS:
    a=bpy.data.actions.new('AN_MageT_'+name)
    a.use_fake_user=True
    a['mage_t_generated']=True
    rig.animation_data.action=a
    loop=name in ('idle','walk','strafe_left','strafe_right')
    frames=sorted(set([1,end,round(1+(end-1)*.25),round(1+(end-1)*.45),round(1+(end-1)*.65),round(1+(end-1)*.8)])) if BLOCKING else range(1,end+1)
    for f in frames:
        scene.frame_set(f)
        apply(name,0 if loop and f==end else (f-1)/(end-1))
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion',frame=f,group=b.name)
            b.keyframe_insert('location',frame=f,group=b.name)
    for layer in a.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    for k in fc.keyframe_points:
                        k.interpolation='CONSTANT' if BLOCKING else 'BEZIER'
                        k.handle_left_type=k.handle_right_type='AUTO_CLAMPED'
    for label,frame in ([('Preparação',6),('Disparo recomendado',8),('Recuperação',12)] if name=='cast' else [('Invocação',8),('Marca do meteoro',15),('Recuperação',19)] if name=='cast_up' else []):
        a.pose_markers.new(label).frame=frame
    tr=rig.animation_data.nla_tracks.new()
    tr.name=name
    # Faixa começa no frame 0: o frame 1 da action sai em t=0 no GLB. Começando em 1, o three.js
    # segurava a primeira pose por um quadro (tranco no ciclo) e deslocava o quadro de impacto.
    tr.strips.new(name,0,a)
    tr.mute=True
    actions[name]=a
    rig.animation_data.action=None
rig.animation_data.action=actions['idle']
scene.frame_start,scene.frame_end=1,dict(CLIPS)['idle']
scene.frame_set(1)
for im in bpy.data.images:
    if im.source=='FILE' and im.has_data:
        im.pack()
bpy.ops.object.select_all(action='DESELECT')
for o in (rig,mesh,staff):o.hide_set(False);o.hide_render=False;o.select_set(True)
bpy.context.view_layer.objects.active=rig
if not BLOCKING:
    rig.animation_data.action=None
    for tr in rig.animation_data.nla_tracks:tr.mute=False
    bpy.ops.export_scene.gltf(filepath=asset_path(str(ROOT/'exports/mage_hero_t.glb')),use_selection=True,
        export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
    for tr in rig.animation_data.nla_tracks:tr.mute=True
    rig.animation_data.action=actions['idle']
    scene.frame_set(1)
versions=bpy.context.preferences.filepaths.save_version
try:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=asset_path(str(ROOT/('models/mage_hero_t_blocking.blend' if BLOCKING else 'models/mage_hero_t.blend'))))
finally:
    bpy.context.preferences.filepaths.save_version=versions
print('MAGE_T',json.dumps({'blocking':BLOCKING,'bones':len(bones),'clips':CLIPS,'staff_vertices':len(staff.data.vertices)}))
