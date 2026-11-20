"""Revisão do lobo da Flora; base anterior e forma humana preservadas.

Atual: blender --background --python blender/scripts/flora_wolf_motion.py -- --dynamic
Acrescente --blocking para poses CONSTANT. Sem --dynamic, reproduz a revisão anterior.
"""
import sys as _asset_sys
from pathlib import Path as _AssetPath
_asset_sys.path.insert(0, str(_AssetPath(__file__).resolve().parent))
from asset_paths import asset_path

from pathlib import Path
import ast
import sys
import math
import bpy
from mathutils import Vector,Matrix,Quaternion,Euler

ROOT=Path(__file__).resolve().parents[1]
BLOCKING='--blocking' in sys.argv
DYNAMIC='--dynamic' in sys.argv
STEM='flora_wolf_dynamic' if DYNAMIC else 'flora_wolf_revised'
with bpy.data.libraries.load(asset_path(str(ROOT/'models/flora_tripo_wolf.blend'))) as (src,dst):dst.scenes=src.scenes
scene=dst.scenes[0];scene.name=STEM;bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
mesh=next(o for o in scene.objects if o.type=='MESH')
rig.name='ARM_FloraWolf';mesh.name='FloraWolfBody'
scene.render.fps=30
source={t.name:t.strips[0].action for t in rig.animation_data.nla_tracks}
for t in rig.animation_data.nla_tracks:t.mute=True
rig.animation_data.action=source['idle'];scene.frame_set(1);bpy.context.view_layer.update()
idle={b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in rig.pose.bones}
base_hips=rig.pose.bones['mixamorig:Hips'].matrix.copy()
base_paws={s+kind:rig.pose.bones['mixamorig:'+s+kind].matrix.copy() for s in ['Left','Right'] for kind in ['Hand','Foot']}
base_toes={s:rig.pose.bones['mixamorig:'+s+'ToeBase'].head.copy() for s in ['Left','Right']}
rig.animation_data.action=None
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
for name,head,tail,parent in [
    ('Tail1',(-.025,.14,.43),(-.075,.29,.32),'Hips'),
    ('Tail2',(-.075,.29,.32),(-.175,.45,.12),'Tail1'),
    ('HeadJaw',(.01,-.31,.655),(.01,-.425,.615),'Head')]:
    b=rig.data.edit_bones.new('mixamorig:'+name);b.head=head;b.tail=tail;b.parent=rig.data.edit_bones['mixamorig:'+parent]
bpy.ops.object.mode_set(mode='OBJECT')
bones={b.name.split(':')[-1]:b for b in rig.pose.bones}
for b in rig.pose.bones:b.rotation_mode='QUATERNION'
groups={g.name:g for g in mesh.vertex_groups}
for name in ['Tail1','Tail2','HeadJaw']:groups['mixamorig:'+name]=mesh.vertex_groups.new(name='mixamorig:'+name)
def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
def weights(v,values):
    for g in list(v.groups):mesh.vertex_groups[g.group].remove([v.index])
    total=sum(values.values())
    for n,w in values.items():
        if w>0:groups['mixamorig:'+n].add([v.index],w/total,'REPLACE')
counts={'tail':0,'jaw':0,'mane':0}
tail_vertices=[]
for v in mesh.data.vertices:
    x,y,z=v.co
    old={mesh.vertex_groups[g.group].name:g.weight for g in v.groups}
    if y>.20 or y>.13 and -.12<x<.06 and z>.33:
        u=smooth((y-.21)/.14);root=smooth((y-.13)/.09)
        weights(v,{'Hips':1-root,'Tail1':root*(1-u),'Tail2':root*u});counts['tail']+=1
        tail_vertices.append(v.index)
    elif y<-.32 and .58<z<.655 and abs(x-.01)<.075 and old.get('mixamorig:Head',0)>.6:
        u=.85*smooth((.66-z)/.06)
        weights(v,{'Head':1-u,'HeadJaw':u});counts['jaw']+=1
    elif z>.70 and y>-.08 and abs(x)<.16:
        weights(v,{'Spine2':.7,'Neck':.3});counts['mane']+=1

tree=ast.parse((ROOT/'scripts/mage_hero.py').read_text(encoding='utf8'))
keep={'rot_world','aim_bones','arm','leg','ease'}
funcs=ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in keep],type_ignores=[])
lerp=lambda a,b,t:a+(b-a)*t
exec(compile(funcs,'wolf_motion_helpers','exec'),globals())

if DYNAMIC:
    # A fonte preservada tem idle quadrúpede. A guarda de combate parte do
    # repouso ereto do rig; os clipes de locomoção continuam vindo da fonte.
    for b in rig.pose.bones:
        b.location=Vector();b.rotation_quaternion=Quaternion()
    for short,angles in {
        'Spine':(4,0,0),'Spine2':(4,0,0),'Head':(-8,0,0),
        'LeftArm':(-14,-8,0),'RightArm':(-14,8,0),
        'LeftForeArm':(-18,0,0),'RightForeArm':(-18,0,0),
        'LeftHand':(-8,0,0),'RightHand':(-8,0,0)
    }.items():rot_world(short,tuple(math.radians(a) for a in angles))
    bpy.context.view_layer.update()
    idle={b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in rig.pose.bones}
    base_hips=bones['Hips'].matrix.copy()
    base_paws={s+k:bones[s+k].matrix.copy() for s in ['Left','Right'] for k in ['Hand','Foot']}
    base_toes={s:bones[s+'ToeBase'].head.copy() for s in ['Left','Right']}
def reset_idle():
    for b in rig.pose.bones:
        b.location,b.rotation_quaternion=idle.get(b.name,(Vector(),Quaternion()))
def move_hips(offset,angles):
    origin=base_hips.translation
    change=Matrix.Translation(origin+Vector(offset))@Euler(angles).to_matrix().to_4x4()@Matrix.Translation(-origin)
    bones['Hips'].matrix=change@base_hips
    bpy.context.view_layer.update()
def solve_paw(side,kind,target,q,pole=None):
    if kind=='Hand':arm(side,target,pole if pole is not None else target+Vector((.32 if side=='Left' else -.32,.18,.08)),q)
    else:
        knee_width=0 if DYNAMIC else .35
        leg(side,target,target+Vector((knee_width if side=='Left' else -knee_width,-.35 if DYNAMIC else -.15,.12)))
        bones[side+'Foot'].matrix=Matrix.LocRotScale(target,q,Vector((1,1,1)))
    bpy.context.view_layer.update()
if DYNAMIC:
    # Guarda bípede mais fechada; a locomoção conserva a base original.
    center=base_hips.translation.x
    for side in ['Left','Right']:
        mat=base_paws[side+'Foot'];target=mat.translation.copy()
        target.x=center+(target.x-center)*.60
        solve_paw(side,'Foot',target,mat.to_quaternion())
    idle={b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in rig.pose.bones}
    base_paws={s+k:bones[s+k].matrix.copy() for s in ['Left','Right'] for k in ['Hand','Foot']}
    base_toes={s:bones[s+'ToeBase'].head.copy() for s in ['Left','Right']}

def custom(name,t):
    reset_idle()
    if name=='death':
        buckle=ease([(0,0),(.18,1),(.45,.5),(1,0)],t)
        fall=ease([(0,0),(.18,.03),(.52,.82),(.72,1),(1,1)],t)
        settle=math.sin(max(0,min(1,(t-.52)/.3))*math.pi)*.025
        move_hips((.07*fall,0,-.07*buckle-.17*fall+settle),(.08*fall,1.48*fall,-.10*fall))
    else:
        tuck=ease([(0,0),(.2,1),(.65,1),(1,0)],t)
        move_hips((-.015*tuck,.015*tuck,-.04*tuck),(.12*tuck,0,.07*tuck))
        for side in ['Left','Right']:
            for kind in ['Foot','Hand']:
                mat=base_paws[side+kind];target=mat.translation.copy()
                if DYNAMIC and kind=='Hand':continue
                if kind=='Hand':target+=Vector((0,.025*tuck,.02*tuck))
                solve_paw(side,kind,target,mat.to_quaternion())

def world_turn(short,angles):
    b=bones[short];m=b.matrix.copy()
    b.matrix=Matrix.LocRotScale(m.translation,Euler(angles).to_quaternion()@m.to_quaternion(),Vector((1,1,1)))
    bpy.context.view_layer.update()

def claw_delta(sign,t):
    # Arco contínuo comum aos cortes simples e às duas mãos do cruzado.
    knots=[(0,(0,0,0)),(.27,(sign*.11,.045,.32)),
        (.35,(sign*.085,-.015,.36)),(.46,(-sign*.52,-.24,.05)),
        (.61,(-sign*.65,-.28,-.015)),(.76,(-sign*.30,-.32,.02)),
        (.89,(sign*.015,-.17,.015)),(1,(0,0,0))]
    for i,((a,v),(b,w)) in enumerate(zip(knots,knots[1:])):
        if t<=b:
            u=(t-a)/(b-a);v,w=Vector(v),Vector(w)
            before=knots[max(0,i-1)];after=knots[min(len(knots)-1,i+2)]
            m0=Vector() if i==0 else (w-Vector(before[1]))/(b-before[0])
            m1=Vector() if i+2==len(knots) else (Vector(after[1])-v)/(after[0]-a)
            return (2*u**3-3*u**2+1)*v+(u**3-2*u**2+u)*(b-a)*m0+(-2*u**3+3*u**2)*w+(u**3-u**2)*(b-a)*m1
    return Vector()

def attack(name,t):
    """Quadril inicia a torção; tórax acelera, perna de impulso pivota na ponta."""
    reset_idle()
    side,other,sign=('Right','Left',-1) if name=='claw_1' else ('Left','Right',1)
    prep=ease([(0,0),(.28,1),(.36,.95),(.49,0),(1,0)],t)
    drive=ease([(0,0),(.31,0),(.46,1),(.63,.95),(.84,.3),(1,0)],t)
    hip_twist=sign*(.34*prep-.38*drive)
    chest_twist=sign*(.42*prep-.48*drive)
    shift=Vector((sign*(.05*prep-.065*drive),.045*prep-.075*drive,-.035*prep-.008*drive))
    move_hips(shift,(-.06*prep+.12*drive,sign*.065*(prep-drive),hip_twist))
    world_turn('Spine',(.035*drive,0,chest_twist*.35))
    world_turn('Spine1',(.035*drive,0,chest_twist*.3))
    world_turn('Spine2',(.045*drive,0,chest_twist*.35))
    world_turn('Head',(-.04*drive,0,-(hip_twist+chest_twist)*.55))
    # Em pé, só os pés sustentam o corpo; a mão livre acompanha o tórax.
    for limb in ([other+'Foot'] if DYNAMIC else [other+'Hand',other+'Foot']):
        kind='Hand' if limb.endswith('Hand') else 'Foot';mat=base_paws[limb]
        solve_paw(other,kind,mat.translation,mat.to_quaternion())
    # Calcanhar gira ao redor dos dedos: joelho e coxa respondem ao quadril.
    pivot=base_toes[side]
    heel=.35*prep+.30*drive
    yaw=sign*(.34*prep-.40*drive)
    change=Matrix.Translation(pivot)@Euler((heel,0,yaw)).to_matrix().to_4x4()@Matrix.Translation(-pivot)
    foot=change@base_paws[side+'Foot']
    solve_paw(side,'Foot',foot.translation,foot.to_quaternion())
    target=base_paws[side+'Hand'].translation+claw_delta(sign,t)
    wrist=Euler((-.26*prep+.36*drive,sign*.20*drive,-sign*.45*drive)).to_quaternion()@base_paws[side+'Hand'].to_quaternion()
    # A recuperação contorna o peito pela frente. O cotovelo recebe um
    # polo próprio à frente do ombro, em vez de ser puxado para o tórax.
    elbow_pole=bones[side+'Arm'].head+Vector((sign*.22,-.30,-.04))
    solve_paw(side,'Hand',target,wrist,elbow_pole)

def cross_attack(t):
    reset_idle()
    prep=ease([(0,0),(.28,1),(.36,.95),(.49,0),(1,0)],t)
    drive=ease([(0,0),(.31,0),(.46,1),(.63,.95),(.84,.3),(1,0)],t)
    # Carrega sobre as duas pernas e fecha o peito no X, sem girar os
    # ombros para um só lado como nos cortes individuais.
    move_hips((0,.04*prep-.055*drive,-.035*prep-.015*drive),(-.06*prep+.13*drive,0,0))
    world_turn('Spine',(-.03*prep+.065*drive,0,0))
    world_turn('Spine1',(-.025*prep+.055*drive,0,0))
    world_turn('Spine2',(-.035*prep+.08*drive,0,0))
    world_turn('Head',(.04*prep-.18*drive,0,0))
    for side,sign in [('Right',-1),('Left',1)]:
        foot=base_paws[side+'Foot']
        solve_paw(side,'Foot',foot.translation,foot.to_quaternion())
        # Planos ligeiramente diferentes evitam mãos/antebraços coincidentes
        # quando as duas diagonais se encontram à frente do peito.
        separation=Vector((0,(-.10 if side=='Right' else 0)*drive,(.08 if side=='Right' else -.015)*drive))
        target=base_paws[side+'Hand'].translation+claw_delta(sign,t)+separation
        wrist=Euler((-.26*prep+.36*drive,sign*.20*drive,-sign*.45*drive)).to_quaternion()@base_paws[side+'Hand'].to_quaternion()
        pole=bones[side+'Arm'].head+Vector((sign*.22,-.30,-.04))
        solve_paw(side,'Hand',target,wrist,pole)

def upright(name,t):
    reset_idle()
    phase=t*math.tau
    if name=='idle':
        world_turn('Spine',(.015*math.sin(phase),0,0))
        world_turn('Spine2',(.01*math.sin(phase-.5),0,.008*math.sin(phase)))
        world_turn('Head',(-.01*math.sin(phase-.5),0,0))
    elif name=='howl':
        rise=ease([(0,0),(.25/.7,1),(.65,.85),(1,0)],t)
        world_turn('Spine2',(-.13*rise,0,0))
        world_turn('Neck',(-.12*rise,0,0))
        world_turn('Head',(-.42*rise,0,0))
        for side,sign in [('Left',1),('Right',-1)]:
            world_turn(side+'Arm',(.12*rise,sign*.18*rise,0))
    elif name=='leap':
        # Salto ofensivo ereto, sem converter a recepção em apoio nas mãos.
        arc=math.sin(math.pi*t)**2
        move_hips((0,-.025*arc,.12*arc),(.12*arc,0,0))
        for side in ['Left','Right']:
            mat=base_paws[side+'Hand']
            solve_paw(side,'Hand',mat.translation+Vector((0,-.14*arc,.15*arc)),mat.to_quaternion())
        return
    for side in ['Left','Right']:
        mat=base_paws[side+'Foot']
        solve_paw(side,'Foot',mat.translation,mat.to_quaternion())

# Vértices de cada pata: mede a malha real, não apenas a altura dos ossos.
paw_vertices={}
for side in ['Left','Right']:
    for kind in ['Hand','Foot']:
        indices={g.index for g in mesh.vertex_groups if g.name.startswith('mixamorig:'+side+kind)}
        if kind=='Foot':indices|={g.index for g in mesh.vertex_groups if g.name.startswith('mixamorig:'+side+'Toe')}
        paw_vertices[side+kind]=[v.index for v in mesh.data.vertices if sum(g.weight for g in v.groups if g.group in indices)>.65]

if DYNAMIC:source['claw_cross']=source['claw_1']
actions={}
for name,original in source.items():
    rig.animation_data.action=original
    end=round(original.frame_range[1]);samples=[]
    for f in range(1,end+1):
        scene.frame_set(f)
        samples.append({b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in rig.pose.bones})
    action=bpy.data.actions.new('AN_FloraWolf_'+name);action.use_fake_user=True
    rig.animation_data.action=action
    loop=name in ['idle','walk','strafe_left','strafe_right']
    picks=sorted({1,end,round(1+(end-1)*.2),round(1+(end-1)*.4),round(1+(end-1)*.6),round(1+(end-1)*.8)}) if BLOCKING else range(1,end+1)
    if BLOCKING and name in ['claw_1','claw_2','claw_cross','leap','howl']:
        picks=sorted(set(picks)|{round(1+{'claw_1':.2,'claw_2':.2,'claw_cross':.2,'leap':.47,'howl':.25}[name]*30)})
    for f in picks:
        scene.frame_set(f);t=(f-1)/(end-1)
        if DYNAMIC and name in ['claw_1','claw_2']:attack(name,t)
        elif DYNAMIC and name=='claw_cross':cross_attack(t)
        elif DYNAMIC and name in ['idle','howl','leap']:upright(name,t)
        elif name in ['death','dodge']:custom(name,t)
        else:
            for b in rig.pose.bones:b.location,b.rotation_quaternion=samples[0 if loop and f==end else f-1][b.name]
        phase=t*math.tau
        # Cauda segue o quadril, com atraso na ponta; não herda mais as coxas.
        amount=.05 if name=='idle' else .12
        still=1-ease([(0,0),(.6,1),(1,1)],t) if name=='death' else 1
        amount*=still
        rot_world('Tail1',(-.10+.045*math.sin(phase-.4)*still,amount*math.sin(phase-.6),0))
        rot_world('Tail2',(.065*math.sin(phase-1)*still,amount*.8*math.sin(phase-1.1),0))
        jaw=ease([(0,0),(.25/.7,1),(.65,.85),(1,0)],t) if name=='howl' else .25*math.sin(t*math.pi) if name.startswith('claw') else 0
        rot_world('HeadJaw',(.14*jaw,0,0))
        bpy.context.view_layer.update()
        if name=='howl':
            for side in ['Left','Right']:
                mat=base_paws[side+'Foot']
                solve_paw(side,'Foot',mat.translation,mat.to_quaternion())
        if name!='death':
            # A cauda recolhe em arco quando o uivo aproxima a ponta do piso.
            tail_pitch=-.10+.045*math.sin(phase-.4)*still
            for _ in range(8):
                ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
                tail_low=min(ev.data.vertices[i].co.z for i in tail_vertices)
                if tail_low>=.001:break
                tail_pitch+=.05
                rot_world('Tail1',(tail_pitch,amount*math.sin(phase-.6),0))
                bpy.context.view_layer.update()
            # Mantém o trajeto autoral, levantando apenas a pata que penetra o piso.
            for side in ['Left','Right']:
                for kind in ['Foot','Hand']:
                    ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
                    low=min(ev.data.vertices[i].co.z for i in paw_vertices[side+kind])
                    active='Right' if name=='claw_1' else 'Left' if name=='claw_2' else None
                    planted=(name=='idle' or name=='claw_cross' and kind=='Foot' or name in ['claw_1','claw_2'] and (kind=='Foot' or side!=active) or name=='howl' and kind=='Foot') and (not DYNAMIC or kind=='Foot')
                    if DYNAMIC and name in ['claw_1','claw_2'] and kind=='Foot' and side==active:planted=False
                    if low<-.00005 or planted and abs(low)>.00005:
                        b=bones[side+kind];target=b.head.copy();q=b.matrix.to_quaternion();target.z-=low
                        solve_paw(side,kind,target,q)
        else:
            ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());low=min(v.co.z for v in ev.data.vertices)
            if low<0:
                h=bones['Hips'];mat=h.matrix.copy();mat.translation.z-=low;h.matrix=mat
        for b in rig.pose.bones:
            b.keyframe_insert('location',frame=f,group=b.name);b.keyframe_insert('rotation_quaternion',frame=f,group=b.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:
                        k.interpolation='CONSTANT' if BLOCKING else 'BEZIER';k.handle_left_type=k.handle_right_type='AUTO_CLAMPED'
    if name in ['claw_1','claw_2','claw_cross','leap','howl']:
        event={'claw_1':.2,'claw_2':.2,'claw_cross':.2,'leap':.47,'howl':.25}[name]
        action.pose_markers.new('Impacto' if name!='howl' else 'Emissão').frame=round(1+event*30)
    actions[name]=action
for tr in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(tr)
for name,action in actions.items():
    tr=rig.animation_data.nla_tracks.new();tr.name=name;tr.strips.new(name,1,action);tr.mute=True
rig.animation_data.action=actions['idle'];scene.frame_set(1);scene.frame_start=1;scene.frame_end=85
for im in bpy.data.images:
    if im.source=='FILE' and im.has_data:im.pack()
if not BLOCKING:
    rig.animation_data.action=None
    for tr in rig.animation_data.nla_tracks:tr.mute=False
    bpy.ops.object.select_all(action='DESELECT')
    for ob in [rig,mesh]:ob.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=asset_path(str(ROOT/'exports'/f'{STEM}.glb')),use_selection=True,use_active_scene=True,
        export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
    for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=actions['idle'];scene.frame_set(1)
bpy.data.libraries.write(asset_path(str(ROOT/'models'/(('flora_wolf_dynamic_blocking' if DYNAMIC else 'flora_wolf_blocking')+'.blend' if BLOCKING else STEM+'.blend'))),{scene},fake_user=True)
print('WOLF REVISION',len(bones),'bones',counts,'blocking',BLOCKING)
