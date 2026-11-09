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
def reset_idle():
    for b in rig.pose.bones:
        b.location,b.rotation_quaternion=idle.get(b.name,(Vector(),Quaternion()))
def move_hips(offset,angles):
    origin=base_hips.translation
    change=Matrix.Translation(origin+Vector(offset))@Euler(angles).to_matrix().to_4x4()@Matrix.Translation(-origin)
    bones['Hips'].matrix=change@base_hips
    bpy.context.view_layer.update()
def solve_paw(side,kind,target,q):
    if kind=='Hand':arm(side,target,target+Vector((.32 if side=='Left' else -.32,.18,.08)),q)
    else:
        leg(side,target,target+Vector((.35 if side=='Left' else -.35,-.15,.12)))
        bones[side+'Foot'].matrix=Matrix.LocRotScale(target,q,Vector((1,1,1)))
    bpy.context.view_layer.update()
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
                if kind=='Hand':target+=Vector((0,.025*tuck,.02*tuck))
                solve_paw(side,kind,target,mat.to_quaternion())

def world_turn(short,angles):
    b=bones[short];m=b.matrix.copy()
    b.matrix=Matrix.LocRotScale(m.translation,Euler(angles).to_quaternion()@m.to_quaternion(),Vector((1,1,1)))
    bpy.context.view_layer.update()

def attack(name,t):
    """Quadril inicia a torção; tórax acelera, perna de impulso pivota na ponta."""
    reset_idle()
    side,other,sign=('Right','Left',-1) if name=='claw_1' else ('Left','Right',1)
    prep=ease([(0,0),(.23,1),(.34,1),(.46,0),(1,0)],t)
    drive=ease([(0,0),(.30,0),(.46,1),(.65,.85),(.82,.3),(1,0)],t)
    hip_twist=sign*(.23*prep-.26*drive)
    chest_twist=sign*(.25*prep-.34*drive)
    shift=Vector((sign*(.045*prep-.050*drive),.040*prep-.065*drive,-.045*prep+.012*drive))
    move_hips(shift,(-.05*prep+.09*drive,sign*.045*(prep-drive),hip_twist))
    world_turn('Spine',(.025*drive,0,chest_twist*.35))
    world_turn('Spine1',(.025*drive,0,chest_twist*.3))
    world_turn('Spine2',(.035*drive,0,chest_twist*.35))
    world_turn('Head',(-.04*drive,0,-(hip_twist+chest_twist)*.55))
    # Apoio dianteiro oposto recebe a carga; a traseira oposta conserva o chão.
    for limb in [other+'Hand',other+'Foot']:
        kind='Hand' if limb.endswith('Hand') else 'Foot';mat=base_paws[limb]
        solve_paw(other,kind,mat.translation,mat.to_quaternion())
    # Calcanhar gira ao redor dos dedos: joelho e coxa respondem ao quadril.
    pivot=base_toes[side]
    heel=.33*prep+.25*drive
    yaw=sign*(.23*prep-.30*drive)
    change=Matrix.Translation(pivot)@Euler((heel,0,yaw)).to_matrix().to_4x4()@Matrix.Translation(-pivot)
    foot=change@base_paws[side+'Foot']
    solve_paw(side,'Foot',foot.translation,foot.to_quaternion())
    # Trajetória assimétrica: corte descendente e varredura ascendente.
    knots=[(0,(0,0,0)),(.23,(sign*.075,.09,.12 if side=='Left' else .19)),
        (.34,(sign*.085,.11,.14 if side=='Left' else .21)),
        (.46,(-sign*.10,-.22,.27 if side=='Left' else .10)),
        (.65,(-sign*.20,-.12,.20 if side=='Left' else .065)),
        (.83,(-sign*.08,-.03,.09)),(1,(0,0,0))]
    delta=Vector()
    for (a,v),(b,w) in zip(knots,knots[1:]):
        if t<=b:
            delta=Vector(v).lerp(Vector(w),smooth((t-a)/(b-a)));break
    target=base_paws[side+'Hand'].translation+delta
    wrist=Euler((-.18*prep+.22*drive,sign*.13*drive,-sign*.3*drive)).to_quaternion()@base_paws[side+'Hand'].to_quaternion()
    solve_paw(side,'Hand',target,wrist)

# Vértices de cada pata: mede a malha real, não apenas a altura dos ossos.
paw_vertices={}
for side in ['Left','Right']:
    for kind in ['Hand','Foot']:
        indices={g.index for g in mesh.vertex_groups if g.name.startswith('mixamorig:'+side+kind)}
        if kind=='Foot':indices|={g.index for g in mesh.vertex_groups if g.name.startswith('mixamorig:'+side+'Toe')}
        paw_vertices[side+kind]=[v.index for v in mesh.data.vertices if sum(g.weight for g in v.groups if g.group in indices)>.65]

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
    if BLOCKING and name in ['claw_1','claw_2','leap','howl']:
        picks=sorted(set(picks)|{round(1+{'claw_1':.2,'claw_2':.2,'leap':.47,'howl':.25}[name]*30)})
    for f in picks:
        scene.frame_set(f);t=(f-1)/(end-1)
        if DYNAMIC and name in ['claw_1','claw_2']:attack(name,t)
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
                    planted=name=='idle' or name in ['claw_1','claw_2'] and (kind=='Foot' or side!=active) or name=='howl' and kind=='Foot'
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
    if name in ['claw_1','claw_2','leap','howl']:
        event={'claw_1':.2,'claw_2':.2,'leap':.47,'howl':.25}[name]
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
