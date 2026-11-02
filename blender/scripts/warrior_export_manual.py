"""Exporta os clipes autorais da cena atual; não regenera nem refaz poses."""
from pathlib import Path
from datetime import datetime
import bpy,json
ROOT=Path(__file__).resolve().parents[1]
rig=bpy.data.objects['WarriorRig'];body=bpy.data.objects['WarriorBody'];scene=bpy.context.scene
names=['idle','walk','slash_1','slash_2','slash_3','thrust','shield_bash','death']
if any(t.name=='tornado' for t in rig.animation_data.nla_tracks):names.append('tornado')
backup=ROOT/'backups'/('warrior_before_manual_export_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(backup),copy=True)
tracks={t.name:t for t in rig.animation_data.nla_tracks if t.name in names}
idle=tracks['idle'].strips[0].action
if not any(len(bag.fcurves) for layer in idle.layers for strip in layer.strips for bag in strip.channelbags):
    source=ROOT/'backups/warrior_before_user_walk_refine.blend'
    with bpy.data.libraries.load(str(source),link=False) as (src,dst):dst.actions=['idle']
    restored=dst.actions[0];tracks['idle'].strips[0].action=restored
    print('Idle recuperado da cópia anterior às edições dos cortes.')
# O walk associado à malha contém caminhos de ossos que pertencem ao rig.
if body.animation_data:body.animation_data.action=None
# Limpeza: preservar as ações usadas e o tornado quando presente.
for track in list(rig.animation_data.nla_tracks):
    if track.name not in names:rig.animation_data.nla_tracks.remove(track)
used={t.strips[0].action for t in tracks.values()}
removed=[]
for action in list(bpy.data.actions):
    if action not in used and action.users==0:
        removed.append(action.name);bpy.data.actions.remove(action)
for name,t in tracks.items():t.strips[0].action.name=name
print('Ações sem uso removidas:',removed)
assert len(rig.animation_data.nla_tracks)==len(names)
old_action=rig.animation_data.action;old_frame=scene.frame_current
original=[]
for track in rig.animation_data.nla_tracks:
    if track.name not in names:
        strips=[]
        for strip in list(track.strips):
            strips.append({'name':strip.name,'action':strip.action,'frame_start':strip.frame_start,'frame_end':strip.frame_end,'action_frame_start':strip.action_frame_start,'action_frame_end':strip.action_frame_end,'blend_type':strip.blend_type,'extrapolation':strip.extrapolation,'influence':strip.influence,'scale':strip.scale,'repeat':strip.repeat})
            track.strips.remove(strip)
        original.append((track,strips))
try:
    report={}
    for name,t in tracks.items():
        strip=t.strips[0];a=strip.action;start,end=map(float,a.frame_range)
        strip.action_frame_start=start;strip.action_frame_end=end;strip.frame_start=1;strip.scale=1;strip.repeat=1;strip.frame_end=1+end-start;t.mute=False
        report[name]={'frames':[start,end],'duration':(end-start)/scene.render.fps}
    rig.animation_data.action=None
    if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
    for b in rig.pose.bones:b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
    scene.frame_set(1);bpy.ops.object.select_all(action='DESELECT')
    for name in ['WarriorOrigin','WarriorRig','WarriorBody']:bpy.data.objects[name].select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/warrior.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True)
    (ROOT/'previews/warrior_manual_export.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
finally:
    for track,strips in original:
        for saved in strips:
            strip=track.strips.new(saved['name'],round(saved['frame_start']),saved['action'])
            for key in ['action_frame_start','action_frame_end','scale','repeat','frame_start','frame_end','blend_type','extrapolation','influence']:setattr(strip,key,saved[key])
    for t in rig.animation_data.nla_tracks:t.mute=True
    rig.animation_data.action=old_action;scene.frame_set(old_frame)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/warrior.blend'))
print(json.dumps(report))

# Reaplica a máscara e o escudo destacável a partir da cena autoral recém-salva.
equipment_export=ROOT/'scripts/warrior_equipment_export.py'
exec(compile(equipment_export.read_text(encoding='utf-8'),str(equipment_export),'exec'),{'__file__':str(equipment_export)})
