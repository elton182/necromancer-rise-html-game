"""Abre uma cena de revisão na sessão atual sem substituir a cena anterior."""
from pathlib import Path
import bpy, json
BASE=Path(__file__).resolve().parents[1]
scene=bpy.data.scenes.new('V2 — revisão dos inimigos importados')
bpy.context.window.scene=scene
scene.render.fps=24;scene.frame_end=49
for i,character in enumerate(('knight','mage','wolf','thief','griffin','spider')):
    with bpy.data.libraries.load(str(BASE/'models'/f'v2_enemy_{character}.blend'),link=False) as (src,dst):
        dst.objects=src.objects
        action_names=tuple(src.actions);dst.actions=list(action_names)
    objects=[o for o in dst.objects if o and o.type in ('MESH','ARMATURE','EMPTY')]
    for obj in objects:scene.collection.objects.link(obj)
    for obj in objects:
        if obj.parent is None:
            obj.location.x+=(i%3)*1.7;obj.location.y+=(i//3)*1.8
    arm=next(o for o in objects if o.type=='ARMATURE')
    arm.name='V2Enemy_'+character
    arm['enemy_character']=character
    clips={name.split('.')[0]:a.name for name,a in zip(action_names,dst.actions)}
    arm['review_clips']=json.dumps(clips)
    action=bpy.data.actions[clips['idle']]
    arm.animation_data.action=action;arm.animation_data.action_slot=action.slots[0]
scene.frame_set(1)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':area.spaces.active.shading.type='MATERIAL'
print('Cena de revisão criada:',scene.name,'— cena anterior preservada, sem salvar sobre o Rei.')
