"""Exporta os rigs revisados da sessão MCP sem salvar sobre o arquivo aberto."""
from pathlib import Path
import bpy,json
BASE=Path(__file__).resolve().parents[1]
review=bpy.context.scene
for arm in [o for o in review.objects if o.type=='ARMATURE' and o.get('enemy_character') in ('knight','mage','thief','griffin')]:
    character=arm['enemy_character']
    if globals().get('ONLY') and character!=ONLY:continue
    actions={k:bpy.data.actions[v] for k,v in json.loads(arm['review_clips']).items()}
    temp=bpy.data.scenes.new('Export_'+character);temp.render.fps=24;temp.frame_end=49
    objects=[arm,*arm.children_recursive]
    for obj in objects:temp.collection.objects.link(obj)
    previous_location=arm.location.copy();previous_action=arm.animation_data.action
    previous_slot=arm.animation_data.action_slot
    tracks=[]
    try:
        bpy.context.window.scene=temp;arm.location=(0,0,0)
        for name,action in actions.items():
            track=arm.animation_data.nla_tracks.new();track.name=name
            strip=track.strips.new(name,1,action)
            strip.action_slot=action.slots[0];tracks.append(track)
        arm.animation_data.action=None
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=arm
        bpy.ops.export_scene.gltf(filepath=str(BASE/'exports'/f'v2_enemy_{character}.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_yup=True,export_force_sampling=True)
        # Save with idle as opening pose. NLA tracks retain all actions as dependencies.
        for track in tracks:track.mute=True
        arm.animation_data.action=actions['idle'];arm.animation_data.action_slot=actions['idle'].slots[0]
        temp.frame_set(1)
        bpy.data.libraries.write(str(BASE/'models'/f'v2_enemy_{character}.blend'),{temp,*actions.values()},fake_user=True)
        print('REFINED_EXPORT',character)
    finally:
        for track in tracks:arm.animation_data.nla_tracks.remove(track)
        arm.animation_data.action=previous_action
        if previous_slot:arm.animation_data.action_slot=previous_slot
        arm.location=previous_location;bpy.context.window.scene=review
        bpy.data.scenes.remove(temp)
bpy.data.libraries.write(str(BASE/'models/v2_imported_enemies_review.blend'),{review},fake_user=True)
