"""Revisão humana da Flora, sem gerar ou alterar o lobo.

Usa models/sources/flora_tripo_druid_t.blend como base preservada.
--blocking grava poses CONSTANT; a execução normal exporta a revisão.
"""
import sys as _asset_sys
from pathlib import Path as _AssetPath
_asset_sys.path.insert(0, str(_AssetPath(__file__).resolve().parent))
from asset_paths import asset_path

from pathlib import Path
import ast
import math
import sys
import bpy
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT=Path(__file__).resolve().parents[1]
BLOCKING='--blocking' in sys.argv
with bpy.data.libraries.load(asset_path(str(ROOT/'models/flora_tripo_druid_t.blend'))) as (src,dst):
    dst.scenes=src.scenes
scene=dst.scenes[0]
scene.name='flora_human_revised'
bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
mesh=next(o for o in scene.objects if o.type=='MESH' and not o.name.startswith('Flora_staff'))
staff=next(o for o in scene.objects if o.type=='MESH' and o!=mesh)
rig.name='ARM_FloraHuman';mesh.name='FloraHumanBody';staff.name='FloraHumanStaff'
scene.render.fps=30
source={t.name:t.strips[0].action for t in rig.animation_data.nla_tracks}
for t in rig.animation_data.nla_tracks:t.mute=True
rig.animation_data.action=source['idle']
scene.frame_set(1);bpy.context.view_layer.update()
idle={b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in rig.pose.bones}
base_hand={s:rig.pose.bones['mixamorig:'+s+'Hand'].matrix.copy() for s in ['Left','Right']}
feet={s:rig.pose.bones['mixamorig:'+s+'Foot'].matrix.copy() for s in ['Left','Right']}

# Acrescenta somente controles de capa; repouso dos ossos existentes preservado.
rig.animation_data.action=None
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
for side,sign in [('Left',1),('Right',-1)]:
    b=rig.data.edit_bones.new('mixamorig:SpineCape'+side)
    b.head=(sign*.055,.045,.56);b.tail=(sign*.085,.065,.29)
    b.parent=rig.data.edit_bones['mixamorig:Spine2']
bpy.ops.object.mode_set(mode='OBJECT')
bones={b.name.split(':')[-1]:b for b in rig.pose.bones}
for b in rig.pose.bones:b.rotation_mode='QUATERNION'
groups={g.name:g for g in mesh.vertex_groups}
for n in ['SpineCapeLeft','SpineCapeRight']:
    groups['mixamorig:'+n]=mesh.vertex_groups.new(name='mixamorig:'+n)
def set_weights(v,w):
    for item in list(v.groups):mesh.vertex_groups[item.group].remove([v.index])
    total=sum(w.values())
    for n,value in w.items():
        if value>0:groups['mixamorig:'+n].add([v.index],value/total,'REPLACE')
smooth=lambda t:max(0,min(1,t))**2*(3-2*max(0,min(1,t)))
for v in mesh.data.vertices:
    x,y,z=v.co
    side='Left' if x>0 else 'Right'
    if z>.70:
        set_weights(v,{'Head':1})
    elif .27<z<.60 and y>.025 and abs(x)<.16:
        weight=.8*smooth((.59-z)/.22)
        set_weights(v,{'Spine2':1-weight,'SpineCape'+side:weight})
    elif z<.065:
        set_weights(v,{side+'Foot':1})

# Solução analítica já usada no mago; os controles finais continuam FK.
tree=ast.parse((ROOT/'scripts/mage_hero.py').read_text(encoding='utf8'))
keep={'rot_world','aim_bones','arm','leg','ease'}
funcs=ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in keep],type_ignores=[])
lerp=lambda a,b,t:a+(b-a)*t
exec(compile(funcs,'flora_motion_helpers','exec'),globals())
def reset_idle():
    for b in rig.pose.bones:
        loc,q=idle.get(b.name,(Vector(),Quaternion()))
        b.location=loc;b.rotation_quaternion=q
def tilt(short,angles):
    b=bones[short]
    q=b.bone.matrix_local.to_quaternion()
    base=idle.get(b.name,(None,Quaternion()))[1]
    b.rotation_quaternion=base @ q.inverted() @ Euler(angles).to_quaternion() @ q
def combat(name,t):
    reset_idle()
    release={'cast':.17/.45,'cast_up':.4/.7,'slam':.33/.6}.get(name,.4)
    prep=ease([(0,0),(release*.62,1),(release*.86,1),(release,0),(1,0)],t)
    hit=ease([(0,0),(release*.86,0),(release,1),(release+.14,.72),(1,0)],t)
    r=base_hand['Right'].translation.copy();l=base_hand['Left'].translation.copy()
    hand_q=base_hand['Right'].to_quaternion()
    lean=-.055*prep+.10*hit
    twist=-.12*prep+.12*hit
    hip=Vector((-.012*prep+.012*hit,0,-.01*prep))
    if name=='cast':
        r+=Vector((-.025*prep,.035*prep-.17*hit,.035*prep+.08*hit))
        l+=Vector((.035*hit,-.22*hit,.15*hit))
        hand_q=Euler((-.13*prep+1.0*hit,0,-.04*prep)).to_quaternion()@hand_q
    elif name=='cast_up':
        lift=ease([(0,0),(.23,.2),(release*.86,.85),(release,1),(.78,.75),(1,0)],t)
        r+=Vector((-.025*lift,-.035*lift,.24*lift))
        l+=Vector((.07*lift,-.10*lift,.28*lift))
        hand_q=Euler((-.13*lift,0,.10*lift)).to_quaternion()@hand_q
        lean=-.055*lift;twist=-.08*prep+.06*hit
        tilt('Head',(-.16*lift,0,-.05*lift))
    elif name=='slam':
        r+=Vector((-.015*prep,-.05*prep-.10*hit,.18*prep-.02*hit))
        l+=Vector((.08*hit,-.14*hit,.13*hit))
        # A base da haste encontra o solo na liberação, sem perfurá-lo.
        hand_q=Euler((-.08*prep+.07*hit,0,0)).to_quaternion()@hand_q
        lean=-.09*prep+.19*hit;hip.z=-.015*hit
    elif name=='dodge':
        crouch=ease([(0,0),(.22,1),(.65,1),(1,0)],t)
        hip=Vector((.015*crouch,0,-.065*crouch))
        lean=.48*crouch;twist=.12*crouch
        r+=Vector((-.025*crouch,-.06*crouch,.09*crouch))
        l+=Vector((.025*crouch,-.13*crouch,.12*crouch))
        hand_q=Euler((.65*crouch,0,0)).to_quaternion()@hand_q
    tilt('Hips',(lean*.2,0,twist*.3))
    tilt('Spine',(lean*.4,0,twist*.35))
    tilt('Spine2',(lean*.4,0,twist*.35))
    bpy.context.view_layer.update()
    h=bones['Hips'];mat=h.matrix.copy();mat.translation+=hip;h.matrix=mat
    bpy.context.view_layer.update()
    for side in ['Left','Right']:
        target=feet[side].translation
        leg(side,target,target+Vector((0,-.3,.2)))
        foot=bones[side+'Foot'];foot.matrix=feet[side]
    arm('Right',r,r+Vector((-.25,.14,-.08)),hand_q)
    arm('Left',l,l+Vector((.25,.12,-.08)))
    # Fixa a orientação livre no repouso, sem mudar a pose da mão entre ações.
    if t==0 or t==1:
        bones['LeftHand'].matrix=base_hand['Left']
    blend=smooth(min(1,t/.12,(1-t)/.15))
    for b in rig.pose.bones:
        loc,q=idle.get(b.name,(Vector(),Quaternion()))
        b.location=loc.lerp(b.location,blend)
        b.rotation_quaternion=q.slerp(b.rotation_quaternion,blend)

actions={}
for name,original in source.items():
    duration=(original.frame_range[1]-1)/30
    end=round(duration*30)+1
    # Amostra a base antes de trocar a Action ativa; conserva a marcha revisada.
    samples=[]
    rig.animation_data.action=original
    for f in range(1,end+1):
        time=1+(f-1)/(end-1)*(original.frame_range[1]-1)
        scene.frame_set(math.floor(time),subframe=time-math.floor(time))
        samples.append({b.name:(b.location.copy(),b.rotation_quaternion.copy()) for b in rig.pose.bones})
    action=bpy.data.actions.new('AN_FloraHuman_'+name)
    action.use_fake_user=True
    rig.animation_data.action=action
    loop=name in ['idle','walk','strafe_left','strafe_right']
    picks=sorted({1,end,round(1+(end-1)*.25),round(1+(end-1)*.45),round(1+(end-1)*.65),round(1+(end-1)*.8)}) if BLOCKING else range(1,end+1)
    if BLOCKING and name in ['cast','cast_up','slam']:
        picks=sorted(set(picks)|{round(1+{'cast':.17,'cast_up':.4,'slam':.33}[name]*30)})
    for f in picks:
        scene.frame_set(f)
        t=(f-1)/(end-1)
        if name in ['cast','cast_up','slam','dodge']:
            combat(name,t)
        else:
            sample=samples[0 if loop and f==end else f-1]
            for b in rig.pose.bones:
                b.location,b.rotation_quaternion=sample[b.name]
        phase=t*math.tau
        for side,offset in [('Left',0),('Right',.55)]:
            swing=(.04 if name=='idle' else .09)*math.sin(phase-.6+offset)
            if name in ['cast','cast_up','slam','dodge']:
                swing=.07*math.sin(phase-.6+offset)*math.sin(math.pi*t)
            rot_world('SpineCape'+side,(swing,0,.018*math.sin(phase+offset)))
        bpy.context.view_layer.update()
        if name in ['cast','cast_up','slam','dodge']:
            ev=staff.evaluated_get(bpy.context.evaluated_depsgraph_get())
            low=min(v.co.z for v in ev.data.vertices)
            contact=name=='slam' and abs(t-.33/.6)<.04
            if low<.002 or contact:
                hand=bones['RightHand'];target=hand.head.copy();q=hand.matrix.to_quaternion()
                target.z+=(0 if contact else .002)-low
                arm('Right',target,target+Vector((-.25,.14,-.08)),q)
                bpy.context.view_layer.update()
        # Corrige penetração na sola mantendo alvos independentes para as pernas.
        if name!='death':
            ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
            for side,sign in [('Left',1),('Right',-1)]:
                low=min(v.co.z for v in ev.data.vertices if v.co.x*sign>0 and v.co.z<.17)
                if low < -.00005:
                    foot=bones[side+'Foot'];target=foot.head.copy();q=foot.matrix.to_quaternion();target.z-=low
                    leg(side,target,target+Vector((0,-.3,.2)))
                    foot.matrix=Matrix.LocRotScale(target,q,Vector((1,1,1)))
        else:
            dg=bpy.context.evaluated_depsgraph_get()
            low=min(v.co.z for ob in [mesh,staff] for v in ob.evaluated_get(dg).data.vertices)
            if low<0:
                h=bones['Hips'];mat=h.matrix.copy();mat.translation.z-=low;h.matrix=mat
        for b in rig.pose.bones:
            b.keyframe_insert('location',frame=f,group=b.name)
            b.keyframe_insert('rotation_quaternion',frame=f,group=b.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for k in fc.keyframe_points:
                        k.interpolation='CONSTANT' if BLOCKING else 'BEZIER'
                        k.handle_left_type=k.handle_right_type='AUTO_CLAMPED'
    if name in ['cast','cast_up','slam']:
        release={'cast':.17,'cast_up':.4,'slam':.33}[name]
        action.pose_markers.new('Liberação').frame=round(1+release*30)
    actions[name]=action
for tr in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(tr)
for name,action in actions.items():
    tr=rig.animation_data.nla_tracks.new();tr.name=name;tr.strips.new(name,1,action);tr.mute=True
rig.animation_data.action=actions['idle'];scene.frame_set(1)
scene.frame_start=1;scene.frame_end=97
for im in bpy.data.images:
    if im.source=='FILE' and im.has_data:im.pack()
if not BLOCKING:
    rig.animation_data.action=None
    for tr in rig.animation_data.nla_tracks:tr.mute=False
    bpy.ops.object.select_all(action='DESELECT')
    for ob in [rig,mesh,staff]:ob.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=asset_path(str(ROOT/'exports/flora_human_revised.glb')),use_selection=True,
        use_active_scene=True,export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True)
    for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=actions['idle'];scene.frame_set(1)
bpy.data.libraries.write(asset_path(str(ROOT/('models/flora_human_blocking.blend' if BLOCKING else 'models/flora_human_revised.blend'))),{scene},fake_user=True)
print('FLORA HUMAN',len(rig.data.bones),'ossos',list(actions),'blocking',BLOCKING)
