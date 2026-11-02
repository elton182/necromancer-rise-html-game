"""Cria um ciclo editável de giro, preservando as oito ações autorais existentes.

Executar pelo MCP na cena WarriorRig. Não exporta nem altera o jogo.
Rotação completa nos ossos; origem e objeto do rig permanecem imóveis.
"""
from pathlib import Path
from datetime import datetime
import bpy, math, json, hashlib
from mathutils import Vector, Quaternion, Matrix

ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene
rig=bpy.data.objects['WarriorRig']
assert rig.name in scene.objects, 'Abra a cena do Guerreiro antes de executar.'
assert not any(t.name=='tornado' for t in rig.animation_data.nla_tracks), 'Já existe um tornado: preserve os ajustes manuais.'
assert not bpy.data.actions.get('tornado'), 'Já existe uma ação tornado. Não sobrescrever.'
if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')

def fingerprint(action):
    data=[(fc.data_path,fc.array_index,[(list(k.co),k.interpolation,list(k.handle_left),list(k.handle_right)) for k in fc.keyframe_points]) for layer in action.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]
    return hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()

existing={t.name:t.strips[0].action for t in rig.animation_data.nla_tracks}
before={n:fingerprint(a) for n,a in existing.items()}
backup=ROOT/'backups'/('warrior_before_tornado_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
for t in rig.animation_data.nla_tracks:t.mute=True;t.is_solo=False
rig.animation_data.action=existing['idle'];scene.frame_set(1);bpy.context.view_layer.update()
base={b.name:(b.location.copy(),b.rotation_quaternion.copy(),b.scale.copy()) for b in rig.pose.bones}
hip_base=rig.pose.bones['mixamorig:Hips'].matrix.copy()
pivot=Vector((-rig.location.x,-rig.location.y,0))
ns={'__file__':str(ROOT/'scripts/warrior_pose.py')}
exec(compile((ROOT/'scripts/warrior_pose.py').read_text(encoding='utf-8'),ns['__file__'],'exec'),ns)
arm_pose,leg_pose=ns['arm_pose'],ns['leg_pose']

action=bpy.data.actions.new('tornado');action.use_fake_user=True
action['warrior_asset']=True;action['purpose']='Ciclo editável de giro: um turno em 24 intervalos, sem translação do objeto.'
rig.animation_data.action=action
frames=list(range(1,26));previous={}
def rotate(name,axis,angle):
    b=rig.pose.bones['mixamorig:'+name];rest=b.bone.matrix_local.to_quaternion()
    b.rotation_quaternion=b.rotation_quaternion@(rest.inverted()@Quaternion(axis,angle)@rest)
def smooth(u):return u*u*(3-2*u)

for frame in frames:
    t=(frame-1)/24;theta=-math.tau*t;turn=Quaternion((0,0,1),theta)
    scene.frame_set(frame)
    for b in rig.pose.bones:
        b.location,b.rotation_quaternion,b.scale=base[b.name]
    # O tronco acompanha o impulso, enquanto ombros e cabeça têm pequena compensação.
    sway=math.sin(math.tau*t*2)
    rotate('Spine',(0,0,1),.06*sway);rotate('Spine1',(0,0,1),.06*sway);rotate('Spine2',(0,0,1),.04*sway)
    rotate('Spine',(1,0,0),.045);rotate('Head',(0,0,1),-.08*sway)
    bpy.context.view_layer.update()
    hips=rig.pose.bones['mixamorig:Hips'];mat=hip_base.copy()
    mat.translation+=Vector((.008*sway,0,-.022+.004*math.cos(math.tau*t*2)))
    hips.matrix=Matrix.Translation(pivot)@turn.to_matrix().to_4x4()@Matrix.Translation(-pivot)@mat
    bpy.context.view_layer.update()

    # Um pé apoia enquanto o outro descreve um arco até o próximo contato.
    # Cada pé dá dois passos por volta; a posição do apoio fica fixa no chão.
    for side,sign,offset in [('Right',-1,0),('Left',1,.5)]:
        phase=2*t+offset;cycle=math.floor(phase);u=phase-cycle
        foot_angle=-math.pi*(cycle-offset+.25)
        swing=max(0,(u-.5)*2)
        if u>.5:foot_angle-=math.pi*smooth(swing)
        heading=Quaternion((0,0,1),foot_angle)
        target=pivot+heading@Vector((sign*.108,.012,0))
        target.z=rig.pose.bones['mixamorig:'+side+'Foot'].bone.head_local.z+.007+.032*math.sin(math.pi*swing)
        pole=target+heading@Vector((0,-.22,.13))
        leg_pose(rig,side,target,pole,-.12*math.sin(math.pi*swing),foot_angle)

    def point(v):return pivot+turn@(Vector(v)-pivot)
    right=pivot+Vector((-.04,-.125,.495+.009*sway))
    left=pivot+Vector((.12,-.085,.485-.004*sway))
    arm_pose(rig,'Right',point(right),point(pivot+Vector((-.17,-.11,.43))),turn@Vector((-.94,-.34,.04+.035*sway)),.45)
    # Palma voltada para baixo; pronar também o antebraço para repartir a torção.
    hand=rig.pose.bones['mixamorig:RightHand'];lower=rig.pose.bones['mixamorig:RightForeArm']
    blade=(hand.matrix.to_quaternion()@hand.bone.matrix_local.to_quaternion().inverted())@Vector((0,-1,0));blade.normalize()
    palm=(hand.matrix.to_quaternion()@hand.bone.matrix_local.to_quaternion().inverted())@Vector((0,0,-1))
    palm=(palm-blade*palm.dot(blade)).normalized();goal=Vector((0,0,-1));goal=(goal-blade*goal.dot(blade)).normalized()
    roll=math.atan2(blade.dot(palm.cross(goal)),palm.dot(goal));target_hand=hand.matrix.copy()
    target_hand=Matrix.LocRotScale(hand.head.copy(),Quaternion(blade,roll)@hand.matrix.to_quaternion(),Vector((1,1,1)))
    lower.matrix=Matrix.LocRotScale(lower.head.copy(),Quaternion(lower.vector.normalized(),roll*.55)@lower.matrix.to_quaternion(),Vector((1,1,1)))
    bpy.context.view_layer.update();hand.matrix=target_hand;bpy.context.view_layer.update()
    arm_pose(rig,'Left',point(left),point(pivot+Vector((.22,.02,.43))),turn@Vector((0,0,1)))
    for b in rig.pose.bones:
        if b.name in previous:b.rotation_quaternion.make_compatible(previous[b.name])
        previous[b.name]=b.rotation_quaternion.copy()
        b.keyframe_insert('location',frame=frame,group=b.name)
        b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)

for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for fc in bag.fcurves:
                for k in fc.keyframe_points:k.interpolation='BEZIER';k.handle_left_type='AUTO_CLAMPED';k.handle_right_type='AUTO_CLAMPED'

track=rig.animation_data.nla_tracks.new();track.name='tornado';track.mute=True
strip=track.strips.new('tornado',1,action);strip.action_frame_start=1;strip.action_frame_end=25;strip.frame_start=1;strip.frame_end=25;strip.scale=1;strip.repeat=1
for marker in list(scene.timeline_markers):
    if marker.name.startswith('Tornado · '):scene.timeline_markers.remove(marker)
for f,title in [(1,'início / apoio direito'),(7,'90° / apoio esquerdo'),(13,'180° / apoio direito'),(19,'270° / apoio esquerdo'),(25,'360° / fecha o ciclo')]:scene.timeline_markers.new('Tornado · '+title,frame=f)
scene.render.fps=30;scene.frame_start=1;scene.frame_end=25;scene.frame_preview_start=1;scene.frame_preview_end=25
rig['tornado_editing']='Ação tornado · 1–25 a 30 fps · apoios 1/7/13/19 · 25 repete 1.'
for o in bpy.context.selected_objects:o.select_set(False)
rig.hide_set(False);rig.select_set(True);bpy.context.view_layer.objects.active=rig
rig.show_in_front=True;rig.data.display_type='OCTAHEDRAL'
bpy.ops.object.mode_set(mode='POSE')
for b in rig.pose.bones:b.select=False
rig.data.bones.active=rig.data.bones['mixamorig:RightHand'];rig.pose.bones['mixamorig:RightHand'].select=True
for area in bpy.context.screen.areas:
    if area.type=='DOPESHEET_EDITOR':
        area.spaces.active.mode='ACTION';area.spaces.active.dopesheet.show_only_selected=False
scene.frame_set(1)
assert all(fingerprint(a)==before[n] for n,a in existing.items()), 'Uma ação autoral foi alterada.'
report={'action':'tornado','frames':[1,25],'fps':30,'key_frames':frames,'guide_poses':list(range(1,26,3)),'preserved_actions':list(existing),'previous_actions_unchanged':True,'backup':str(backup),'root_motion':'rig e origem imóveis; giro nos ossos','exported':False}
(ROOT/'previews/warrior_tornado_draft.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/warrior.blend'))
print(json.dumps(report))
