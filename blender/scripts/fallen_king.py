"""Importa o Rei Caído e cria ações locais reproduzíveis no rig Mixamo."""
from pathlib import Path
import bpy, math, json
from mathutils import Vector

BASE = Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(BASE/'exports/fallen_king_source.glb'))
rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
rig.animation_data_create()
def pose(name, xyz):
    bone = rig.pose.bones.get('mixamorig:'+name)
    if bone:
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler = tuple(math.radians(v) for v in xyz)
        bone.keyframe_insert('rotation_euler')

for name in ('idle','walk','windup','attack','cast','recover','death'):
    action = bpy.data.actions.new(name)
    rig.animation_data.action = action
    for frame in range(1,26):
        bpy.context.scene.frame_set(frame)
        t = (frame-1)/24
        for bone in rig.pose.bones:
            bone.rotation_mode='XYZ'; bone.rotation_euler=(0,0,0)
        breath=math.sin(t*math.tau)
        pose('LeftArm',(0,0,-60)); pose('RightArm',(0,0,60))
        pose('Spine',(2*breath,0,0))
        if name=='walk':
            for side,sign in [('Left',1),('Right',-1)]:
                pose(side+'UpLeg',(25*breath*sign,0,0))
                pose(side+'Leg',(max(0,-breath*sign)*30,0,0))
                pose(side+'Arm',(-15*breath*sign,0,-60*sign))
        if name in ('windup','attack','recover'):
            k=t if name=='windup' else 1-t if name=='recover' else math.cos(t*math.pi)
            pose('Spine',(0,0,25*k)); pose('RightArm',(-85*k,0,45)); pose('RightForeArm',(-40,0,0))
        if name=='cast':
            k=math.sin(t*math.pi)
            pose('LeftArm',(-85*k,0,-45)); pose('RightArm',(-85*k,0,45))
            pose('Head',(-15*k,0,0))
        if name=='death':
            pose('Hips',(85*t,0,15*t)); pose('LeftLeg',(-35*t,0,0)); pose('Head',(30*t,0,0))
        for bone in rig.pose.bones:
            bone.keyframe_insert('rotation_euler',frame=frame)
    action.use_fake_user=True
rig.animation_data.action=bpy.data.actions['idle']
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/boss_fallenKing.blend'))
report={'rig':rig.name,'bones':len(rig.data.bones),'actions':[a.name for a in bpy.data.actions],
        'status':'Ações geradas; deformação, render e integração ainda pendentes de validação visual.'}
(BASE/'previews/fallen_king_validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
