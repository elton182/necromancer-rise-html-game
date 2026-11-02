"""Reconstrói somente o Guerreiro; pode ser executado pelo MCP do Blender."""
from pathlib import Path
import math
import re
import bpy
from mathutils import Vector, Quaternion, Euler, Matrix
ROOT = Path(__file__).resolve().parents[1]
scene = bpy.context.scene
if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
# Preservar uma cópia da sessão antes da reconstrução do asset.
(ROOT / 'backups').mkdir(exist_ok=True)
if bpy.data.filepath: bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'backups/warrior_mcp_session.blend'), copy=True)
for o in [a for a in scene.objects if a.type == 'ARMATURE']:
    if o.type == 'ARMATURE' and ((o.name=='Armature' and any(c.type=='MESH' and c.name.startswith('tripo_node_05761498') for c in o.children)) or o.get('warrior_asset')):
        for child in list(o.children_recursive): bpy.data.objects.remove(child,do_unlink=True)
        bpy.data.objects.remove(o,do_unlink=True)
# Remover somente ações órfãs das gerações do Guerreiro, antes de criar novas.
owned=re.compile(r'^(idle|walk|slash_[123]|thrust|shield_bash|cast|death|jump|attack|guard)(\.\d+)?$')
for action in list(bpy.data.actions):
    if action.users==0 and (action.get('warrior_asset') or owned.fullmatch(action.name)):
        bpy.data.actions.remove(action)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'reference/warrior/warrior_source.glb'))
rig = next(o for o in bpy.context.selected_objects if o.type == 'ARMATURE')
rig.name = 'WarriorRig';rig['warrior_asset'] = True
obj = next(o for o in rig.children_recursive if o.type == 'MESH')
obj.name = 'WarriorBody'
# O original traz espada longe do corpo e escudo abaixo da mão.
# Vincular rigidamente as peças preserva UV, material e malha originais.
for label, ids, grip, target, turn in [
 ('RightHand',[v.index for v in obj.data.vertices if v.co.y<0],Vector((-.257,-.474,.47)),Vector((-.345,.382,.519)),True),
 ('LeftHand',[v.index for v in obj.data.vertices if v.co.x>.15 and v.co.z<.44],Vector((.275,.44,.30)),Vector((.31,.32,.53)),False)]:
    group=obj.vertex_groups.get('mixamorig:'+label) or obj.vertex_groups.new(name='mixamorig:'+label)
    for g in obj.vertex_groups: g.remove(ids)
    group.add(ids,1,'REPLACE')
    for i in ids:
        v=obj.data.vertices[i];co=v.co-grip
        if turn: co=Euler((math.pi*1.5,0,0)).to_matrix()@co
        v.co=target+co
scene.render.fps=30
rig.animation_data_clear();rig.animation_data_create()
bones={b.name.split(':')[-1]:b for b in rig.pose.bones}
def rotation(key,angles):
    b=bones.get(key)
    if not b:return
    basis=b.bone.matrix_local.to_quaternion()
    b.rotation_quaternion=basis.inverted()@Euler(angles).to_quaternion()@basis
pose_namespace={}
exec(compile((ROOT/'scripts/warrior_pose.py').read_text(encoding='utf-8'),str(ROOT/'scripts/warrior_pose.py'),'exec'),pose_namespace)
arm_pose=pose_namespace['arm_pose'];leg_pose=pose_namespace['leg_pose']
clips=[('idle',61),('walk',25),('slash_1',22),('slash_2',24),('slash_3',29),('thrust',25),('shield_bash',25),('death',31)]
motion_namespace={}
exec(compile((ROOT/'scripts/warrior_motion_data.py').read_text(encoding='utf-8'),str(ROOT/'scripts/warrior_motion_data.py'),'exec'),motion_namespace)
motion=motion_namespace['motion']
for name,frames in clips:
    action=bpy.data.actions.new(name);action['warrior_asset']=True;rig.animation_data.action=action
    for frame in range(1,frames+1):
        scene.frame_set(frame)
        t=(frame-1)/(frames-1);wave=math.sin(t*math.tau)
        for b in rig.pose.bones:
            b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0)
        pose=motion(name,t)
        right,left,sword,shield=(pose[k] for k in ['right','left','sword','shield'])
        rotation('Hips',(pose['lean']*.15,0,pose['twist']*.45))
        rotation('Spine',(pose['lean']*.25,0,pose['twist']*.20))
        rotation('Spine1',(pose['lean']*.30,0,pose['twist']*.20))
        rotation('Spine2',(pose['lean']*.30,0,pose['twist']*.15))
        rotation('RightShoulder',(0,-.10*pose['extension'],pose['twist']*.10))
        rotation('LeftShoulder',(0,.08*pose['shield_extension'],-pose['twist']*.06))
        rotation('Head',(-pose['lean']*.45,0,-pose['twist']*.35))
        if name=='death':rotation('Hips',(min(1,t*1.4)*1.5,0,.12*t))
        bpy.context.view_layer.update()
        right_pole=Vector((-.23,.40,.39));left_pole=Vector((.22,.40,.39))
        if name=='death':
            hip=bones['Hips'];transform=hip.matrix@hip.bone.matrix_local.inverted()
            right=transform@right;left=transform@left;right_pole=transform@right_pole;left_pole=transform@left_pole
            sword=transform.to_quaternion()@sword;shield=transform.to_quaternion()@shield
        else:
            # Postura de guarda: joelhos destravados e pés desencontrados.
            hip=bones['Hips'];mat=hip.matrix.copy();mat.translation+=Vector(pose['hip']);hip.matrix=mat
            bpy.context.view_layer.update()
            for side,sign in [('Right',-1),('Left',1)]:
                foot=bones[side+'Foot'].bone.head_local.copy()+Vector((sign*.012,sign*-.02,0))+Vector(pose['feet'].get(side,(0,0,0)))
                yaw=pose['foot_yaw'].get(side,0);pole=foot+Quaternion((0,0,1),yaw)@Vector((0,-.20,.12))
                leg_pose(rig,side,foot,pole,pose['foot_pitch'].get(side,0),yaw)
        arm_pose(rig,'Right',right,right_pole,sword,pose['extension'])
        arm_pose(rig,'Left',left,left_pole,shield,pose['shield_extension'])
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)
            b.keyframe_insert('location',frame=frame,group=b.name)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for channel in bag.fcurves:
                    for key in channel.keyframe_points:
                        key.interpolation='BEZIER';key.handle_left_type='AUTO_CLAMPED';key.handle_right_type='AUTO_CLAMPED'
    track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,1,action);track.mute=True
manual_walk=ROOT/'reference/warrior/walk_user_poses.json'
if manual_walk.exists():
    walk_namespace={}
    exec(compile((ROOT/'scripts/warrior_walk_refine.py').read_text(encoding='utf-8'),str(ROOT/'scripts/warrior_walk_refine.py'),'exec'),walk_namespace)
    walk_namespace['refine_walk'](rig,manual_walk)
# Ancorar o asset inteiro no centro das solas na pose de guarda.
# A compensação fica no rig, sob uma raiz estável em (0,0,0), preservando os clipes locais.
for previous in [o for o in scene.objects if o.get('warrior_origin')]:
    bpy.data.objects.remove(previous,do_unlink=True)
rig.animation_data.action=next(tr.strips[0].action for tr in rig.animation_data.nla_tracks if tr.name=='idle')
scene.frame_set(1);bpy.context.view_layer.update()
evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
sole=[obj.matrix_world@v.co for v in evaluated.data.vertices if (obj.matrix_world@v.co).z<.08]
anchor=Vector(((min(v.x for v in sole)+max(v.x for v in sole))/2,(min(v.y for v in sole)+max(v.y for v in sole))/2,min(v.z for v in sole)))
origin=bpy.data.objects.new('WarriorOrigin',None);scene.collection.objects.link(origin);origin['warrior_origin']=True;origin.empty_display_size=.12
rig.parent=origin;rig.location=-anchor
rig.animation_data.action=None
for b in rig.pose.bones:
    b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0)

scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
origin.select_set(True);rig.select_set(True);obj.select_set(True);bpy.context.view_layer.objects.active=rig
obj.data.calc_loop_triangles()
assert len(obj.data.loop_triangles)<=4594 and len(obj.data.materials)==1, 'Asset excedeu o orçamento existente.'
assert len(rig.animation_data.nla_tracks)==8
# Tracks devem estar ativos na exportação; cada clipe é exportado separadamente.
for tr in rig.animation_data.nla_tracks:tr.mute=False
bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/warrior.glb'),use_selection=True,export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS')
for tr in rig.animation_data.nla_tracks:tr.mute=True
rig.animation_data.action=next(tr.strips[0].action for tr in rig.animation_data.nla_tracks if tr.name=='idle')
scene.frame_start=1;scene.frame_end=61;scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/warrior.blend'))
print('Guerreiro: equipamentos vinculados e '+str(len(clips))+' clipes exportados.')
