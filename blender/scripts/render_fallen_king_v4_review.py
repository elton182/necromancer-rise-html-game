"""Renderiza quadros de revisão do Fallen King v4 para GIFs (Cycles, câmera fixa por grupo).

blender --background --python blender/scripts/render_fallen_king_v4_review.py -- preview
blender --background --python blender/scripts/render_fallen_king_v4_review.py
python blender/scripts/pack_fallen_king_v4_review.py

Sem preview, renderiza todos os grupos. Uma sombra no chão (shadow catcher)
mostra o contato de pés e espada; o fundo é composto pelo empacotador.
"""
from pathlib import Path
import bpy, sys, json
from mathutils import Vector
BASE=Path(__file__).resolve().parents[1]
PREVIEW='preview' in sys.argv
ONLY=[a for a in sys.argv[sys.argv.index('--')+1:] if a!='preview'] if '--' in sys.argv else []
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/boss_fallenKing_v4.blend'))
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE')
meshes=[o for o in sc.objects if o.type=='MESH' and not o.hide_render]
# Grupo: (ações em sequência, passo entre quadros renderizados, quadros de prévia por ação).
GROUPS={
    'idle':([('idle',2)],{'idle':[1,25]}),
    'walk':([('walk',1)],{'walk':[1,9]}),
    'attack':([('windup',1),('attack',1),('recover',1)],{'windup':[18],'attack':[5,9]}),
    'slam':([('slam_windup',1),('slam',1),('slam_recover',1)],{'slam_windup':[18],'slam':[8,14]}),
    'cast':([('cast',2)],{'cast':[17]}),
    'death':([('death',2)],{'death':[13,39]}),
}
def use(name):
    action=bpy.data.actions[name]
    rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
    return int(action['frames'])

sc.render.engine='CYCLES';sc.cycles.samples=16;sc.cycles.use_denoising=True
sc.render.resolution_x=sc.render.resolution_y=512;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.render.film_transparent=True
sc.world=sc.world or bpy.data.worlds.new('Revisão')
sc.world.use_nodes=True
background=next(n for n in sc.world.node_tree.nodes if n.type=='BACKGROUND')
background.inputs[0].default_value=(.18,.22,.28,1);background.inputs[1].default_value=.22
bpy.ops.mesh.primitive_plane_add(size=6,location=(0,0,0))
floor=bpy.context.object;floor.name='Chão de revisão';floor.is_shadow_catcher=True
center=Vector((0,-.08,.42))
direction=Vector((.65,-1,.45)).normalized()
bpy.ops.object.camera_add(location=center+direction*6)
cam=bpy.context.object;cam.data.type='ORTHO';sc.camera=cam
cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
# Luz-chave quente, preenchimento fraco e recorte frio: volume sem lavar as cores.
for offset,power in [((-1,-2,3),260),((2,-1,1),120),((0,2,2),320)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(offset))
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=2
    lamp.rotation_euler=(center-lamp.location).to_track_quat('-Z','Y').to_euler()
inverse=cam.rotation_euler.to_quaternion().inverted()
origin=cam.location.copy()
manifest={}
for group,(sequence,preview) in GROUPS.items():
    if ONLY and group not in ONLY:continue
    # Câmera fixa no grupo inteiro: salto e alcance da espada aparecem sem reenquadrar.
    lo=Vector((1e9,1e9));hi=Vector((-1e9,-1e9))
    for name,step in sequence:
        for frame in range(1,use(name)+1,2):
            sc.frame_set(frame);deps=bpy.context.evaluated_depsgraph_get()
            for obj in meshes:
                ev=obj.evaluated_get(deps)
                for v in ev.data.vertices:
                    p=inverse@(ev.matrix_world@v.co-origin)
                    lo.x=min(lo.x,p.x);lo.y=min(lo.y,p.y);hi.x=max(hi.x,p.x);hi.y=max(hi.y,p.y)
    mid=(lo+hi)/2
    cam.location=origin+cam.rotation_euler.to_quaternion()@Vector((mid.x,mid.y,0))
    cam.data.ortho_scale=max(hi.x-lo.x,hi.y-lo.y)*1.18
    folder=BASE/'frames/fallen_king_v4_review'/group;folder.mkdir(parents=True,exist_ok=True)
    entries=[]
    for name,step in sequence:
        frames=use(name)
        chosen=preview.get(name,[]) if PREVIEW else list(range(1,frames+1,step))
        for frame in chosen:
            sc.frame_set(frame)
            path=folder/f'{len(entries):03}.png' if not PREVIEW else folder/f'preview_{name}_{frame:02}.png'
            sc.render.filepath=str(path);bpy.ops.render.render(write_still=True)
            entries.append(dict(file=path.name,action=name,frame=frame,step=step))
    manifest[group]=entries
if not PREVIEW:
    (BASE/'frames/fallen_king_v4_review/manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({k:len(v) for k,v in manifest.items()}))
